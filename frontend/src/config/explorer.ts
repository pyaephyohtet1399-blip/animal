import type { ExplorerLevel } from "@/types/explorer";

export interface ExplorerLevelCopy {
  /** Column heading. */
  title: string;
  /** Local-language heading, shown under the English one. */
  titleMm: string;
  /** Accessible name for the column's search field. */
  searchLabel: string;
  searchPlaceholder: string;
  /** Shown when the level has no records at all. */
  emptyTitle: string;
  /** Shown when records exist but the search text matches none of them. */
  noResultTitle: string;
}

/**
 * Per-level wording for the explorer. Kept in `config` so the components stay
 * presentational and the copy can be reviewed in one place.
 */
export const EXPLORER_LEVEL_COPY = {
  township: {
    title: "Townships",
    titleMm: "မြို့နယ်",
    searchLabel: "Search townships",
    searchPlaceholder: "Name or code",
    emptyTitle: "No townships available",
    noResultTitle: "No township matches this search",
  },
  townVillage: {
    title: "Town / Village Tracts",
    titleMm: "မြို့ / ရွာတိုင်း",
    searchLabel: "Search town or village tracts",
    searchPlaceholder: "Name or code",
    emptyTitle: "No town or village tracts",
    noResultTitle: "No tract matches this search",
  },
  wardVillage: {
    title: "Wards / Villages",
    titleMm: "ရပ်ကွက် / ရွာ",
    searchLabel: "Search wards or villages",
    searchPlaceholder: "Name or code",
    emptyTitle: "No wards or villages",
    noResultTitle: "No ward or village matches this search",
  },
} satisfies Record<ExplorerLevel, ExplorerLevelCopy>;

export const EXPLORER_COPY = {
  /** Shown in the scope bar while nothing is selected. */
  scopeAll: "Showing the whole district",
  scopeTownship: "Showing one township",
  scopeTownVillage: "Showing one town / village tract",
  scopeWardVillage: "Showing one ward / village",
  /** Label for the level the lists are currently scoped to. */
  scopeValue: "Scope",
  backOneLevel: "Back one level",
  showAll: "Show all",
  backOneLevelHint: "Clears the deepest selected level",
  showAllHint: "Clears the selection and lists the whole district",
  /** Describes the village link that sits on each village row. */
  openVillageDetail: "Open village detail",
} as const;
