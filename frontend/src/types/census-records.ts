import type { InterviewInfo } from "@/types/census";
import type { PlaceRef } from "@/types/explorer";
import type { LivestockCensus } from "@/types/livestock";
import type { Option, SortState } from "@/types/ui";

/**
 * A row of the census records table: one household interview with its place
 * resolved and its livestock census attached.
 *
 * The relationship is already walked by the data layer, so no component has to
 * join `interview_info` to `answer` to `category` to `restriction`. A place is
 * `null` only when a parent row is missing, which is a data problem the tables
 * below render honestly rather than hide.
 */
export interface CensusRecord {
  /** `interview_info` exactly as stored. */
  interview: InterviewInfo;
  township: PlaceRef | null;
  tract: PlaceRef | null;
  village: PlaceRef | null;
  /** Sum of `answer.count` for this interview. */
  livestockCount: number;
  /** Rows in `answer` for this interview. */
  answerCount: number;
  /** Distinct `main_category` ids this household recorded animals under. */
  mainCategoryIds: string[];
  /** Distinct `category` ids this household recorded animals under. */
  categoryIds: string[];
  /** The resolved livestock census, reused by the row detail panel. */
  census: LivestockCensus;
}

/**
 * One option in a filter select.
 *
 * `parentCode` is what makes a filter dependent: with no parent chosen every
 * option is offered, and choosing one narrows the level below it.
 */
export interface FilterOption extends Option {
  /** Owning code one level up, or `null` at the root. */
  parentCode: string | null;
}

/** Everything `/census` needs, loaded once per request. */
export interface CensusDataset {
  records: CensusRecord[];
  townships: FilterOption[];
  tracts: FilterOption[];
  villages: FilterOption[];
  /** Distinct `ans_date` values, newest first. */
  dates: FilterOption[];
  mainCategories: FilterOption[];
  categories: FilterOption[];
}

/**
 * What narrows a set of census records. Kept separate from the sort and paging
 * so other screens — the records table and the reports — can share the same
 * matching and validation without inheriting a pager.
 */
export interface CensusRecordFilters {
  query: string;
  townshipCode: string | null;
  tractCode: string | null;
  villageCode: string | null;
  mainCategoryId: string | null;
  categoryId: string | null;
  /** Inclusive ISO date bounds on `interview_info.ans_date`. */
  dateFrom: string | null;
  dateTo: string | null;
}

/** Sortable columns of the census records table. */
export type CensusSortKey =
  | "h_name"
  | "township"
  | "tract"
  | "village"
  | "ans_date"
  | "livestock";

/** The applied query for `/census`. Lives in the URL, so a view can be shared. */
export interface CensusFilterState extends CensusRecordFilters {
  sort: SortState<CensusSortKey>;
  page: number;
}