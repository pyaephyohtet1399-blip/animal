# Backend Decision List - Livestock Survey System

> `backend-architecture.md` implementation အတွက် open items များအားလုံး ဆုံးဖြတ်ပြီး (**Finalized: 2026-10-04**)
> Architecture နဲ့ ကိုက်ညီအောင် ဆုံးဖြတ်ထားခြင်း။ Architecture doc ပြင်ရန် text fixes များကို အောက်ဆုံး §9 တွင် ကြည့်ပါ။
> Implementation plan: `docs/implementation.md` | Status: ✅ = Decided (all items)

---

## 0. Locked

| ID | Decision |
|----|----------|
| D-00a | **Node.js 20 + Express.js + MongoDB Atlas (Mongoose) + Redis** |
| D-00b | **OpenAPI မလို** — contract ကို `implementation.md` တွင်ပဲ ဖော်ပြမည် |

## 1. Language & Core

| ID | Item | Decision | Notes |
|----|------|----------|-------|
| D-01 | Language | **JS (CommonJS)** | Architecture code sample အားလုံး JS; TS = future |
| D-02 | Validation | **Zod** | Architecture (env + request validation) အတိုင်း |
| D-03 | Scripts | `dev, start, lint, test:unit, test:integration, seed, rebuild:summaries` | implementation.md §3 အတိုင်း |

## 2. Location Data

| ID | Item | Decision | Notes |
|----|------|----------|-------|
| D-04 | Code semantics | **`tspCode` = မြို့နယ်**, `tvgCode` = မြို့/ကျေးရွာအုပ်စု, `wvCode` = ကျေးရွာ, ခရိုင် = prefix | Architecture အများစု (users line 99, login table line 113, permission logic) နဲ့ ကိုက်; line 53/65/164 label/comment မှားနေသည် → §9 fix |
| D-05 | District | **Collection မလို** — `districtCode` (prefix, `MMR0100`) ကို `surveys`/`users` တွင် denormalize | Query scoping + multi-district ready |
| D-06 | Code format | **pcode**: tsp=`MMR010028`, tvg=`MMR010031047`, wv=`194657` | `"001"`-style ဥပမာဟောင်း ဖျက် (§9) |
| D-07 | Scope | **Single district** (1 ခရိုင် / 4 မြို့နယ် / ~840 ကျေးရွာ) + D-05 field ထည့်ထား | — |
| D-08 | Seed source | Format: `data/locations.csv`, `data/categories.json`, `data/users.csv`; scripts idempotent upsert | CSV data ထုတ်ပေးရန် = user/owner |
| D-09 | Password policy | **Default (seed)**: per-user random **10 chars** (a-z, A-Z, 0-9; ambiguous `O0l1I` မပါ) → `data/generated-passwords.csv` (loginCode, password, village, township, district)<br>**New password rule**: length **8–64** (bcrypt 72-byte cap), ≥1 letter + ≥1 digit, ≠ old password, ≠ loginCode<br>**bcrypt 12**, `POST /auth/change-password` (`{oldPassword, newPassword}`) | Account 1:1 phone design နဲ့ ကိုက် |
| D-50 | loginCode spec | **Normalize**: `trim + toUpperCase` ပြီးမှ lookup; format guard: village = numeric pcode (`^\d{4,8}$`, ဥပမာ `194657`), township = `^MMR\d{6}$` (`MMR010028`), district = `^MMR\d{4}$` (`MMR0100`), **ward (village role) = `^MMR\d{12}$` (`MMR010031701504`, 31 accts — data-driven amendment 2026-10-04: CSV/MySQL ထဲက ရပ်ကွက် 31 ခု wvCode = MMR+12 digits)**; unique index | Architecture line 108-114 rules အတိုင်း + input normalization ထည့် |
| D-51 | Role source | **DB `role` field authoritative**; `determineRole()` pattern check ကို **seed/create time မှာပဲ** assert (login time မှာ မသုံး) | Architecture line 123-131 ambiguity ဖြေရှင်း |
| D-52 | districtCode derivation | **Seed time မှာ `townships` doc ထဲ သိမ်း** (ဥပမာ `MMR0100`) → users/surveys ကို copy; runtime string slicing မသုံး | 7-char prefix rule က dataset အတွက် coincidence — explicit field က ပိုဘေးကင်း |
| D-53 | Password reset | **District admin `POST /auth/reset-password {loginCode}`** → new random default; self-service (email/SMS) **မလို** — field မှာ infra မရှး | Forgotten password → district admin က reset |

## 3. Survey Workflow & Permissions

| ID | Item | Decision | Notes |
|----|------|----------|-------|
| D-10 | Status enum | **`draft \| submitted \| township_verified \| district_approved \| rejected`** + `verifiedBy/At, approvedBy/At, rejectedBy/At, rejectedReason` | Overview (line 21) 3-ဆင့် flow + `approve` permission (line 902) နဲ့ ကိုက်; line 358 enum ချဲ့ရ (§9) |
| D-11 | Approval flow | **2-step**: Village submit → Township verify → District approve / reject (reason ပါ) | Overview "မြို့နယ် စစ်ဆေး, ခရိုင် အတည်ပြု" အတိုင်း |
| D-12 | Create permission | **Village only creates**; Township/District = edit-in-scope + verify/approve/reject | API table (line 541) + offline flow (line 830) အတိုင်း; Role table (line 745) "Create ✅" ပြင်ရ (§9) |
| D-13 | Edit after submit | **မရ** — reject → village edit → re-submit | Data integrity |
| D-14 | Delete | **Soft delete** (`deletedAt`); Village = own draft only; District = any (audit; **summary reverse = status counted ဖြစ်နေမှသာ** — D-38) | Submit ပြီး record reject path သုံး |
| D-15 | `villageHeadmanId` | **Survey creator (village user) `_id`** | line 162 define ဖြည့် |
| D-16 | Household uniqueness | **Allow** — အိမ်တစ်အိမ် = survey များစွာ ရိုက်နိုင် | Duplicate check = name+phone warn only |

## 4. API Contract

| ID | Item | Decision | Notes |
|----|------|----------|-------|
| D-17 | Pagination | **`page` + `per_page` (max 100) တစ်ခုတည်း** | Response meta နဲ့ ကိုက်; cursor (line 1262) ဖယ်ရ |
| D-18 | Sync push | **Batch**: `{ items: [{ localRowId, op, surveyId?, survey, interview }] }` ≤ 50/request; `Idempotency-Key` = **per HTTP request** | line 557 "per queue item" ပြင်ရ |
| D-19 | Conflict | **Item-level**: `status:'rejected', error:{code:'version_conflict', serverVersion, serverData}` (HTTP 200, per-item) | Client = server data ဆွဲပြီး merge/resubmit |
| D-20 | Sync pull | `GET /sync/pull?since=&types=surveys,locations,categories&cursor=` + `serverTime` + tombstone (`deletedAt`) | Reference data offline download အတွက်ပါ |
| D-21 | Endpoints | ထည့်: locations ×3, categories ×3, `/auth/change-password`, `/reports/drilldown`, `/reports/district/:tspCode/export`, `/surveys/:id/verify\|approve\|reject` | Route map = implementation.md §7 |
| D-22 | Date range | Report များတွင် **`from`/`to`** (ansDate) params | — |
| D-23 | Excel export | **Sync** (≤ 50k rows, township scope); over → Phase 2 job | — |
| D-24 | `type` whitelist | **`bigAnimals\|smallAnimals\|poultry\|breedingAnimals`** enum validate — `` `$${type}` `` injection ကာကွယ်; **v2 amendment (2026-10-05)**: `type=breedingAnimals` + `ageFrom/ageTo/ageLimit` param ပါရင် **422** (breeding = age dimension မရှိ, D-54) | Security must |
| D-25 | Search regex | **`escapeRegex()`** ပြီးမှ `$regex` | Security must |
| D-54 | Breeding 4th type | **4th animal type = `breedingAnimals` (မျိုးတိရစ္ဆာန်မွေးမြူထားရှိမှု)** — Option A: same survey + conditional section (breeding-farm အိမ်မှ ပဲ ကောက်; မပါရင် `[]`):<br>• Shape: `[{categoryId, sex:'male'\|'female', count}]` — **age မပါ, `ca_male` မပါ** (sex 2 enum)<br>• Category master **သီးသန့် `breedingcategories`** (နာမည်တူ/မတူ categoryId space ခွဲ; seed = spec table 6 rows: ဒေသနွား, ဒေသကျွဲ, နို့စားကျွဲ, ဝက်, ဆိတ်, သိုး)<br>• `hasBreeding: Boolean` server-derived (`length>0`) + list filter `GET /surveys?hasBreeding=true` (သီးသန့်စာရင်း)<br>• Summary: `totalBreedingAnimals` + `breedingBreakdown` key **2-part `categoryId:sex`** (ကျန် 3 type = 3-part အတိုင်း)<br>• Reports **အကုန်ပါ**: district/township/drilldown/export (Excel **3 columns**: total/အထီး/အမ); L3 byAge = `ageLimit: null`<br>• workflow/sync/RBAC မပြောင်း | User confirm 4/4 (2026-10-05) |
| D-55 | ageLimit per type | **Form spec (2026-10-05): 3 type စီ သီးသန့် age enum — English enum ဆက်သုံး** (single source `src/constants/ageLimits.js` = `AGE_LIMITS` + `AGE_RANKS`):<br>• big: `LessThanOne` (၁နှစ်အောက်), `Between1and3` (၁နှစ်မှ၃နှစ်), `Over3` (၃နှစ်အထက်) — မပြောင်း<br>• small: `Under2months` (၂လအောက်), `Between2and6months` (၂လမှ၆လ), `Over6months` (၆လအထက်) — ဟောင်းက big enum ကူးထား (year-based) **မှား**<br>• poultry: `Young` (ငယ်), `Middle` (လတ်), `Old` (ကြီး) — ဟောင်းက `LessThanOne\|OverOne` ၂ ခုပဲ **မလုံ**<br>• Report `ageFrom/ageTo` = per-type rank map + `$in`; cross-type value / old value → **422**<br>• Migration `scripts/migrate-age-limits.js` (`npm run migrate:age-limits`: poultry `OverOne→Old`, `LessThanOne→Young`, small year→month map + rank-preserving) + summaries recompute | Form screenshot 2 + user spec; **DB/API = English enum** (user ရွေး) |

## 5. Auth & Security

| ID | Item | Decision | Notes |
|----|------|----------|-------|
| D-26 | JWT claims | **Full payload**: `userId, loginCode, role, districtCode, tspCode, tvgCode, wvCode` | line 724 အတိုင်း; `generateTokens` (line 870) ပြင် |
| D-27 | TTL | **Access 15m** (`JWT_ACCESS_TTL`), **Refresh 7d** (`JWT_REFRESH_TTL`) | env `JWT_EXPIRATION:24h` ဖျက် |
| D-28 | Refresh token | **`refreshtokens` collection** + rotation (reuse → revoke all) + logout revoke | — |
| D-29 | CSRF | **None** — Bearer header only; `csurf` (deprecated) မသုံး | line 985 ဖယ်ရ |
| D-30 | Rate limit | **Custom Redis limiter တစ်ခုတည်း** + `trust proxy: 1` | `express-rate-limit` (line 1217) ဖယ်ရ |
| D-31 | CORS | `methods` + `PATCH`, `allowedHeaders` + `Idempotency-Key, X-Request-Id` | Sync preflight ကာကွယ် |
| D-32 | Lockout | 5 fail → 15 min (Redis) | — |
| D-33 | PII | hPhone: scope အတွင်းပဲ; audit log mask; retention = backup 35d | — |
| D-34 | Body limit | `express.json({ limit: '1mb' })` | Batch sync အတွက် |
| D-56 | Force-change gate | **ဖျက်ပြီး (2026-10-05)** — `forceChangeGate` middleware + `mustChangePassword: true` seed/reset behavior ဖယ်။ လက်ရှိ loginCode/password နဲ့ တိုက်ရိုက် အလုပ်လုပ်အောင်လုပ်။ `mustChangePassword` field ကို schema/JWT မှာ vestigial အနေနဲ့ ထိန်းသိမ်း (default false)။ change-password endpoint က ဆက်လက်ရှိ — လိုချင်တဲ့အချိန်မှာ ကိုယ့်ဘာသူ ပြောင်းလို့ရ | User request — ပထမ login မှာ password အရင်ပြောင်းစရာ မလိုဘဲ အလုပ်လုပ်ချင်လို့ |
| D-57 | Locations scoping | **locations ×3 + sync pull locations (2026-10-05)** — role အလိုက် ကန့်သတ်: village = `townships:{tspCode}` / `townvgs:{tvgCode}` / `wardvillages:{wvCode}` (ကိုယ့်အဆင့်ပဲ), township = `townships:{tspCode}` / `townvgs:{tspCode}` / `wardvillages` = Townvg `distinct tvgCode` subquery, district = အားလုံး + query param filter ခွင့်ရှိ; param ကို lower role မှာ ignore; cache key ထဲ scope ထည့် (`locations:townships:tsp:<code>` စသည်); sync pull locations လည်း အတူတူ scope | မူလ version က village ကို မြို့နယ် ၄ ခု/ရွာ ၈၄၀ အကုန်ပြ — survey form မှာ ကိုယ့်အဆင့်ပဲ လိုအပ်တာမို့ data exposure လျှော့ချ |
| D-58 | Workflow removal | **verify/approve/reject ဖျက်ပြီး (2026-10-05)** — status = `draft → submitted` ပဲ (submit = နောက်ဆုံး), `COUNTED_STATUSES = [submitted]`, summary `+1` = submit မှာ; village = own draft ပဲ edit ရ (submitted ဆို 🔒), township = own tsp အကုန် edit ရ (status ကနေမလို), district = အကုန် edit ရ; sync push `op:'submit'` ထည့် (idempotency ပါ); migration = `township_verified/district_approved → submitted`, `rejected → draft` + summary rebuild | User request — submit ပြီးရင် ပြီးသွားစေချင်တာ, offline (Flutter SQLite) နဲ့ online sync လုပ်ချင်တာ |

## 6. Reliability & Data Integrity

| ID | Item | Decision | Notes |
|----|------|----------|-------|
| D-35 | ID counters | Redis AOF on + startup `SETNX` sync + 30min reconcile (DB max vs counter) | Duplicate ID ကာကွယ် |
| D-36 | Idempotency race | **`SETNX idem:lock:<key>` 30s** + result cache `idem:<key>` 24h | Concurrent double-apply ကာကွယ် |
| D-37 | Create atomic | **MongoDB session transaction**: interview + survey | Atlas replica set ရရှိပြီး |
| D-38 | Summary | Delta `$inc`: **verify မှာ +1** (counted set ဝင်ချိန်), reject/delete မှာ **−1 (counted ဖြစ်မှသာ)**; submit/approve = delta မပါ + **`rebuild-summaries.js`**; Report filter = `township_verified + district_approved` | **v2 amendment (2026-10-04)**: "submit +" ဟောင်း → "verify +" ပြောင်း — D-11 report filter နဲ့ summary fast path / direct aggregation slow path / rebuild သုံးခု တူအောင်။ ဟောင်းက submit + ဆိုရင် unverified survey က summary မှာ ပါပြီး direct query မှာ မပါ → drift |
| D-39 | Queue | **Phase 1: none** (fire-and-forget); Phase 2: **BullMQ** (`bull` deprecated) | Export/audit job အတွက်သာ |
| D-40 | Audit log | **`auditlogs` collection** + async insert, TTL 90d | auditQueue define မဖြစ် issue ဖြေရှင် |
| D-41 | Health | `/health` + `/health/ready`, fail = **503** | line 2044 vs 2770 ပေါင်း |

## 7. Ops, Testing, Deployment

| ID | Item | Decision | Notes |
|----|------|----------|-------|
| D-42 | Tests | **Jest + Supertest + mongodb-memory-server**; coverage 80%; Playwright = Phase 2 | — |
| D-43 | Lint | **ESLint + Prettier** | `npm run lint` အလုပ်လုပ်အောင် |
| D-44 | Deploy | **Docker image + PM2 cluster + nginx (TLS 443 + 80→443 redirect)** | line 1982 port 80 only → §9 fix |
| D-45 | CI | GitHub Actions: lint → unit → integration; deploy = Phase 2 | — |
| D-46 | Env | `MONGODB_URI, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_TTL, ALLOWED_ORIGINS, PORT, NODE_ENV, RATE_LIMIT_WINDOW_MS, BODY_LIMIT, ID_COUNTER_RECONCILE_MINUTES` | implementation.md §4 |
| D-47 | Atlas tier | Dev **M0**, Prod **M10+** (k6 smoke ပြီးမှ tier confirm) | — |
| D-48 | Queue lib | **BullMQ** (Phase 2) | `bull` မသုံး |

---

## 8. Pending Items (ဆုံးဖြတ်ချက် မဟုတ် — အချက်အလက်/လူသုံး input လို)

| Item | Owner | Note |
|------|-------|------|
| Seed CSV data (locations, categories, users) | User | Format D-08 အတိုင်း; scripts က ready |
| Prod domain/SSL cert, ALLOWED_ORIGINS | User | Deploy phase မှာ |
| Atlas cluster credentials | User | `.env` ထဲ |

## 9. Architecture Doc Follow-up Fixes (`backend-architecture.md`)

ဆုံးဖြတ်ချက်များနဲ့ alignment ဖြစ်အောင် ပြင်ရန် (text-only, decision မဟုတ်):

1. **D-04**: line 53 `townships (ခရိုင်များ)` → `(မြို့နယ်များ)`, line 65 `townvgs (မြို့နယ်များ)` → `(မြို့/ကျေးရွာအုပ်စုများ)`, line 164 `tspCode // ခရိုင်` → `// မြို့နယ်`
2. **D-06**: line 619/640 `"001"`-style examples → pcode
3. **D-10**: line 358/398 status enum 5 ခုအဖြစ် ချဲ့ + approval fields schema ထည့်
4. **D-12**: line 745-749 Role Permissions table (Township/District Create ✅) → edit/verify/approve only
5. **D-17**: line 1258-1277 cursor pagination section ဖယ် (page-based တစ်ခုတည်း)
6. **D-18**: line 557 `Idempotency-Key` "per queue item" → "per HTTP request (batch)"
7. **D-26/27**: line 870 `generateTokens` full claims 15m/7d; line 1157 `JWT_EXPIRATION` row ဖျက်, env table ပြည့်စုံပြင်
8. **D-29/30**: line 985 csurf section ဖယ်; line 1217 express-rate-limit section ဖယ် (custom Redis တစ်ခုတည်း)
9. **D-44**: nginx config TLS443 + redirect ထည့်
10. **D-41**: line 2770 health 500 → 503
11. **D-49**: duplicate sections (Testing line 2616/2694, Backup line 2667/2804), numbering ထပ်များ (4.4-4.7 ×2, section 8 ×3, section 9 ရှေ့ရောက်), TOC ဖြည့်, line 2842 `api-spec.yaml` reference ဖျက်
12. **D-09/53**: users schema (line 91-106) ထဲ `mustChangePassword: Boolean` field ထည့်; Login Rules section (line 108) တွင် D-50 normalization + format rule, D-51 role check rule ဖြည့်ရေး (**D-56**: force-change gate ဖျက်ပြီး — field က vestigial)

---

✅ **အားလုံး Decided** — implementation `docs/implementation.md` §15 Phase 0 မှ စတင်နိုင်ပါပြီ။ §9 fixes များ architecture doc ထဲ လုပ်ပေးရမလား?
