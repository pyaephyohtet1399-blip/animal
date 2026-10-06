# Livestock Census Management System — Frontend

Administrative data management system for livestock census data of
Meiktila District, Myanmar.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Lucide

## Data hierarchy

```
Meiktila District
  -> Township
    -> Town / Village Tract
      -> Ward / Village
        -> Household / Interview
          -> Livestock Census
```

## Source tables

`user` · `township` · `town_vg` · `ward_village` · `interview_info` ·
`main_category` · `category` · `restriction` · `answer`

## Folder structure

```
src/
├── app/            # App Router routes, root layout, global stylesheet
│   ├── census/     # Census records route and its loading skeleton
│   ├── dashboard/  # District overview route and its loading skeleton
│   ├── explorer/   # Explorer route, village detail route, loading skeletons
│   ├── reports/    # Reports route and its loading skeleton
│   └── not-found.tsx
├── components/
│   ├── ui/         # Generic primitives (see Design system)
│   ├── layout/     # App shell, navigation rail, top bar
│   ├── shared/     # Cross-feature building blocks (page header, detail list, stat card, state panel, search input, print button, skeletons)
│   ├── table/      # Data table, toolbar, filters, pagination
│   ├── explorer/   # Master-detail explorer components
│   ├── village/    # Village detail header and summary
│   ├── interview/  # Household interview table, rows and details
│   ├── livestock/  # Livestock census summary, sections, table and badges
│   ├── census/     # Census records table, columns and controls
│   ├── reports/    # Report sections and scope filters
│   ├── dashboard/  # Dashboard summary cards and sections
│   └── charts/     # Reusable Recharts wrappers
├── config/         # App metadata, navigation, per-feature copy
├── data/           # Mock JSON — single source of truth until a backend exists
├── hooks/          # Client-side hooks shared by more than one feature
├── lib/            # Pure logic: queries, aggregation, search, url helpers
│   └── repositories/  # The only place that reads src/data
└── types/          # Domain models (mirror the SQL/DML columns only)
```

### Where things live

The split is by responsibility, and a component never holds business logic:

- `components/ui` — one concern per file, no feature knowledge. Add here only
  when a component is genuinely generic.
- `components/shared` — building blocks used by more than one feature
  (`PageHeader`, `StatCard`, `DetailList`, `StatePanel`, `SearchInput`,
  `PrintButton`, skeletons).
- `components/<feature>` — anything that knows about a feature's vocabulary.
- `lib` — pure functions over data: parsing the URL, validating filters, sorting,
  paginating, aggregating. No React, so they are testable on their own and are
  shared by the records table, the reports and the dashboard.
- `hooks` — a client-side derivation used by more than one component. Today that
  is `useDependentOptions`, so the records table and the reports cannot drift in
  how they narrow a filter.
- `lib/repositories` — the only module that imports from `src/data`. Components
  receive resolved objects and never parse or filter raw rows.

## Mock data

`src/data` holds the census tables as JSON. `user.json` is intentionally empty —
the real schema has not been supplied yet.

Everything else is a small synthetic set, sized so the interesting states can
actually be reached: townships with and without tracts, a tract with no villages,
a village with no interviews, an interview with no livestock answers, and enough
spread across the four townships for the charts to have something to compare.
`main_category` and `category` are the taxonomy as supplied and `restriction` is
unchanged. Answer rows keep their foreign keys valid — no row points at a
category or restriction that does not exist.

## Data explorer

`/explorer` walks the census hierarchy:

```
Meiktila District
  → Township                township.tspCode / tspName
    → Town / Village Tract  town_vg.tvgCode / tvgName
      → Ward / Village      ward_village.wvCode / wvName
```

- **Every column is populated on arrival.** With nothing selected the three
  columns list the whole district; choosing a township narrows the tract and
  village columns to it, and choosing a tract narrows the village column
  further. Nothing is ever blank just because a parent is missing.
- **Two ways back out.** The scope bar says what the columns are limited to and
  offers "back one level" (drop the deepest selection) and "show all" (drop the
  selection entirely).
- **One shape for every level.** `lib/repositories/explorer.ts` reads the three
  tables through their own repositories and normalizes them to `LocationNode`
  (`code`, `name`, `parentCode`), so the UI never branches on level and a real
  API can replace the repository without touching a component.
- **Selection lives in the URL** — `?tsp=&tvg=&wv=`. Views are shareable, the
  back button works, and a child implies its parent, so `?wv=194407` is enough.
- **Codes are validated on the server.** An unknown code, or a tract that
  belongs to a different township than the one in the URL, is dropped rather
  than rendered, so the chain can never describe an impossible branch.
- **Search is per level and client-side**, matching the name or the code. Each
  search box remembers the scope it was typed in, so changing the scope resets
  the box without an effect.
- **Village rows carry two targets.** Clicking the row selects the village (and
  shows its summary below); the chevron beside it opens the village's own page.
  The two are siblings, never nested, so both stay keyboard reachable.

Components in `components/explorer/`:

`ExplorerLayout` · `ExplorerColumn` · `ExplorerView` (client) ·
`ExplorerControls` (client) · `LocationSearch` · `LocationList` ·
`LocationListItem` · `LocationBreadcrumb` · `LocationDetails`

## Village detail

`/explorer/[wvCode]` shows one ward / village and the household interviews
recorded against it.

```
ward_village  →  interview_info  →  answer      (Phase 05)
   wvCode          wvCode             p_Id
```
- **The village code is the whole URL.** `getWardVillageChain()` walks up
  `ward_village` → `town_vg` → `township` server-side, so the breadcrumb is
  derived from the same rows as the page and cannot drift from them.
- **A missing code renders the styled not-found page** rather than a village
  with an unknown township. Note that a dynamic route that streams still answers
  with HTTP 200; only the rendered result is a 404.
- **One column list drives three views.** `INTERVIEW_COLUMNS` in
  `config/interview.ts` generates the table header, the cells and the detail
  panel fields, so a column can never be added to one and missed in another.
- **The `p_Id` join key is shown** in the interview panel, above an explicit
  placeholder for the livestock answers that join on it in the next phase.

Components:

`village/VillageHeader` · `village/VillageSummary` (reuses
`explorer/LocationDetails` and `shared/StatCard`) ·
`interview/InterviewTable` (client) · `interview/InterviewRow` ·
`interview/InterviewDetails` · `ui/DetailPanel`

`ui/DetailPanel` is a generic slide-over: focus moves in and back, Tab is
trapped, Escape and the backdrop close it, and the page behind cannot scroll.
Its `size` prop widens it for content that needs the room.

## Livestock census

The interview panel resolves `answer` into something readable:

```
interview_info.p_Id  →  answer.p_Id
                          ├─ answer.cat_id → category.cat_id → main_category.mcat_id
                          └─ answer.rid   → restriction.rid
```

- **The join happens once, in the data layer.**
  `lib/repositories/livestock.ts` returns `LivestockCensus`: groups by
  `main_category`, each holding resolved `category` rows with their
  `restriction`. No component knows the relationship exists.
- **Counts are never recomputed or edited.** `answer.count` is passed through as
  recorded; the only derived figure is the total, which is the sum of the stored
  counts for that interview. A row that cannot be linked to a category or a
  restriction is left out of the table, reported to the reader, and still
  counted in the total.
- **Restriction codes are shown unchanged**, with a readable label beside them.
  `config/restriction.ts` holds the expansions; a code the DML does not define —
  currently `MS` — is rendered as the bare code rather than guessed at.
- **Groups follow `main_category` order**, rows follow `answer.id`, so the
  section order is stable regardless of how the source returns rows.

Components in `components/livestock/`:

`LivestockSection` (composition) · `LivestockSummary` · `MainCategorySection` ·
`LivestockTable` · `LivestockRow` · `CategoryBadge` · `RestrictionBadge`
(+ `AgeRestrictionBadge`, `SexRestrictionBadge`) · `CountDisplay`

## Dashboard

`/dashboard` is the district overview. It counts, it does not navigate: the
explorer is for finding a place, the dashboard is for seeing the whole picture.

- **Every figure is calculated at request time.**
  `lib/repositories/statistics.ts` reads the tables, counts rows, sums the stored
  `answer.count` values and aggregates them. Nothing is stored and nothing is
  written into the code.
- **Zero rows are left out of the charts.** A township or animal group with no
  records is still counted in the totals but gets no bar — a zero-length bar is
  noise. The totals and the charts therefore never claim to cover the same set.
- **Aggregates keep table order**, so townships, animal groups and categories
  appear in the order the DML lists them rather than in whatever order a sort
  happened to produce.

Summary cards: total townships, town / village tracts, villages, interview
records and livestock.

Charts, all fed from the same statistics layer:

| Chart | Measure |
| --- | --- |
| Livestock by Township | sum of `answer.count` per township |
| Livestock by Main Category | same, grouped by `main_category` |
| Livestock by Category | same, grouped by `category` |
| Male vs Female | same, grouped by `restriction.sex` |
| Interview Records by Township | rows in `interview_info` per township |

Bottom row: the most recently answered households, and the district livestock
total with each animal group's share of it.

Components:

`charts/ChartCard` · `charts/BarChart` · `charts/HorizontalBarChart` ·
`charts/ChartEmptyState` · `charts/chart-config` (series colours, tooltip props,
`ChartFrame`, `barColor`) · `dashboard/DashboardSummaryCards` ·
`dashboard/RecentInterviews` · `dashboard/LivestockOverview`

`BarChart` and `HorizontalBarChart` take plain `{ label, value }` data and share
their frame, tooltip and bar cells from `charts/chart-config.tsx`, so any new
statistic is plotted by mapping it and neither chart knows a census table exists.
`ChartCard` owns the empty case, so no screen repeats that branch. Series colours
come from the `--color-chart-*` tokens, and `SEX_CHART_COLORS` pins one colour to
each `restriction.sex` code wherever sex is plotted.

## Census records

`/census` is the searchable list of every household interview in the district,
with the place it belongs to and the livestock counted in it. One row is one
`interview_info` record; its geography and its livestock census are resolved by
the data layer, not in the table.

- **The query is the URL.** `lib/census.ts` owns the whole contract — parsing,
  serialising, validating, filtering, sorting, paging — and every function in it
  is pure. Filtering therefore happens in one place on the server, a filtered
  view is shareable, and the back button steps through filter changes.
- **Dependent filters** are expressed by narrowing the option list, not by a
  special mode: with no township chosen the tract select offers every tract, and
  choosing `မလှိုင်` narrows it to that township's tracts and their villages. The
  same rule applies to main category → category.
- **Impossible queries are repaired, not rendered.** A tract paired with the
  wrong township, a category outside the chosen group, an inverted date range or
  an unknown code is dropped, keeping the rest of the query. A stale `?page=` is
  clamped to the last page.
- **Sorting is delegated.** `DataTable` reports which header was clicked and the
  host decides what to do with it: today it sorts the array, against an API it
  sends `?sort=&dir=`.
- **Row click opens the record** in a slide-over that reuses `InterviewDetails`,
  so a household reads exactly as it does on the village page. Clicking the row
  is a mouse convenience; the Actions cell holds a real button, so keyboard
  users get the same route without a table row being turned into a widget.

URL parameters: `q` `tsp` `tvg` `wv` `mc` `cat` `from` `to` `sort` `dir` `page`.

Components in `components/table/` — all reusable and feature-agnostic:

`DataTable` · `TableToolbar` · `FilterSelect` · `DateFilter` · `ActiveFilter` ·
`Pagination`

`SearchInput` lives in `components/shared/` because the explorer uses it too; it
is the only search box in the app, and `debounceMs={0}` commits per keystroke for
lists already in memory while a server query keeps the default pause. It reports
changes through a ref-held callback, so a new closure on each parent render cannot
restart its debounce timer and starve the search.

`DataTable` takes render callbacks, so it can only be rendered from a client
component — a server component cannot pass a function across the boundary. Hosts
that want to stay on the server should render the `ui/table` primitives directly.

Empty results reuse the shared `StatePanel` rather than growing a second empty
state: with filters applied it says so and offers to clear them, and with no
records at all it says that instead.

`CENSUS_PAGE_SIZE` in `lib/census.ts` is the single knob for paging. When the
backend lands it becomes a `limit` sent to the endpoint; nothing above
`paginate()` changes.

## Data access

`src/lib/repositories` is the only module that imports from `src/data`. Every
function is `async`, so replacing the JSON with an endpoint does not change a
single caller — that is what makes the RTK Query phase a swap rather than a
rewrite.

The relationship between the tables is walked in exactly one place per shape:

| Resolver | Joins |
| --- | --- |
| `repositories/explorer` | `ward_village` → `town_vg` → `township` |
| `repositories/livestock` | `answer` → `category` → `main_category`, and `answer` → `restriction` |
| `repositories/census` | one record per `interview_info`, with the geography and livestock census attached |
| `lib/reports`, `lib/statistics` | aggregation over those records — no second join |

A repository never invents a value it did not read, and never edits one. Where a
row cannot be joined, the result says so (`unresolvedCount`) rather than guessing.

## Reports

`/reports` is one scope arranged five ways: by township, by village tract, by
village, by animal category and by sex. It reuses the census records rather than
querying again — a report is a different *arrangement* of the same data, not
different data.

- **Nothing is invented.** Place reports are laid out over the geography tables
  and filled from the scoped records, so an unsurveyed tract shows its real
  village count and a real `0`. The two livestock reports come only from the
  records, so they appear only when animals were actually counted. A scope with
  no records at all shows one empty state instead of five empty tables.
- **Row order is fixed** — primary measure descending, name ascending — so two
  printed reports of the same scope can be compared line by line.
- **Scope filters** (township, village tract, village, date) are dependent in
  the same way as everywhere else and live in the URL, so a printed document can
  be reproduced from the address bar. There is no search box and no paging: a
  report covers a fixed set.
- **Validation is shared.** `normalizeReportScope` reuses
  `normalizeRecordFilters` from `lib/census.ts`, so an impossible combination is
  dropped the same way it is in the records table, and a child implies its
  parent (`?tvg=` alone reports on that township).
- **Export is deliberately absent.** The UI is built first; Excel and PDF export
  belong to the phase that has an API to point at.

URL parameters: `tsp` `tvg` `wv` `from` `to`.

### Printing

Every print decision is centralised in `src/app/globals.css`. Components only
name the intent with one of five utilities and never write print CSS themselves:

| Utility | Effect |
| --- | --- |
| `print-none` | Dropped from the print — navigation, filters, buttons, charts |
| `print-only` | Printed only — the cover note |
| `print-full-width` | Uses the whole sheet instead of the app's max width |
| `print-break-before` | Starts a new printed page |
| `print-keep-together` | Keeps a heading with its table across a break |

The base `@media print` block drops the chrome (`header[role="banner"]`,
`aside`), strips shadows and sticky positioning, and sets `@page` to A4 with
12 mm margins. `PrintButton` in `components/shared/` only calls
`window.print()`; the charts are `print-none` because bars in monochrome lose
their meaning, and the tables beside them are what actually prints.

> Note: these utilities are declared with `@utility`, not a plain
> `@layer utilities` block — Tailwind v4 only emits the former.

## Design system

All colour, radius and typography decisions live in `src/app/globals.css`.
Components only use the semantic tokens mapped there.

`components/ui` — generic primitives, one concern per file:

| Component | Purpose |
| --- | --- |
| `badge` | Status and count labels (`success`, `warning`, `info`, `destructive`) |
| `breadcrumb` | Geographic trail, current entry rendered as text |
| `button` | Actions; `buttonVariants` is reused by links |
| `card` | Surface with header / content / footer slots |
| `input`, `label`, `select`, `textarea` | Form controls, all `h-10` for long data entry || `separator` | Horizontal or vertical rule |
| `detail-panel` | Slide-over for reading one record beside its list |
| `print-button` | Opens the browser print dialog; all print rules live in the stylesheet |
| `skeleton`, `spinner` | Loading affordances |
| `table` | Dense census tables with tabular numerals |

`components/shared` — cross-feature building blocks:

`page-header` · `detail-list` · `stat-card` · `state-panel` (`empty` / `error`)

Feature folders (`explorer`, `census`, `dashboard`, `charts`) must compose these
primitives and must not redefine them.

## Architecture rules

1. **Mock data lives in `src/data`** and is read only through
   `src/lib/repositories`. Components never import JSON directly.
2. **Repository functions are `async`**, so replacing JSON with a real API
   endpoint does not change any component.
3. **No invented schema.** Types are added only for columns that exist in the
   project SQL/DML, and a stored value is never rewritten — readable labels sit
   *beside* a code, never in place of it.
4. **Design tokens are centralized** in `src/app/globals.css`
   (`:root` variables mapped through `@theme inline`). Components use semantic
   tokens such as `bg-card`, `text-muted-foreground`, `border-border` — never raw
   hex values.
5. **One focus treatment.** The global `:focus-visible` outline handles focus;
   components do not declare their own focus ring.
6. **Print rules are centralised** in `src/app/globals.css`. A component names
   the intent with `print-none` / `print-only` / `print-break-before` /
   `print-keep-together` and never writes its own print CSS.
7. **Reuse before adding.** Generic primitives live in `components/ui`; feature
   folders must not redefine them.
8. **UI is separated from business logic** — repositories and types hold the
   data rules, components only present them.
9. **Navigation is declared once** in `src/config/navigation.ts` and rendered by
   `NavList` only. An entry stays `enabled: false` until its phase lands, so
   ordering never shifts between phases.
10. **Render what the data says.** Place names and codes come from
   `src/data`; nothing is invented to fill a gap in a level.

## Commands

```bash
pnpm dev        # start the dev server
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
```

## Roadmap

- **Phase 01 — Project Setup & Architecture** (done): structure, tokens,
  primitives, typed data layer.
- **Phase 02 — Design System + App Shell** (done): expanded primitive set,
  shared building blocks, chart colour tokens, skip link, nested-route aware
  navigation, config-driven phase indicator.
- **Phase 03 — Livestock Database Explorer** (done): three-column
  District → Township → Town / Village Tract → Ward / Village explorer with
  URL-backed selection, per-level search, geographic breadcrumb and a selected
  village panel.
- **Phase 04 — Village Detail + Household / Interview** (done): village page
  with its hierarchy header, summary and interview record table, plus a
  slide-over detail panel per household.
- **Phase 05 — Livestock Census Detail** (done): the household's livestock
  census in the interview panel — total, then one section per `main_category`
  with the `category` and `restriction` values resolved.
- **Phase 06 — Dashboard + Statistics + Bar Charts** (done): district totals,
  five Recharts bar charts over the same statistics layer, recent interviews and
  the livestock share breakdown.
- **Phase 07 — Census Records + Search + Filters** (done): one row per household
  interview, URL-driven search, six dependent filters, sortable columns, paging
  and a row detail panel.
- **Phase 08 — Reports** (done): five reports over one scope — township, tract,
  village, animal category, sex — with a centralised print stylesheet.
- **Phase 09 — Refactoring** (done): project-wide duplication audit. One search
  box, one dependent-filter derivation, one set of chart internals, one skeleton
  vocabulary, one set of aggregate types; the dashboard's parallel aggregation
  removed in favour of the census dataset; dead code deleted.
- **Phase 05 — Livestock Census Detail**.
- **Phase 06 — Dashboard + Statistics + Bar Charts**.
- **Phase 07 — Census Records + Search + Filters**.
- **Phase 08 — Reports**.
- **Phase 09 — Reusable Component Refactoring**.
- **Phase 10 — Responsive + Loading + Empty + Error + Validation**.
- **Phase 11 — Final UI/UX Polish**.
- **Phase 12 — Redux Toolkit + RTK Query + Backend + MySQL**.
