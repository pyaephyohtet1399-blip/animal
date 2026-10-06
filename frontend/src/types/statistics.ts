import type { SexCode } from "@/types/census";
import type { CensusRecord } from "@/types/census-records";

/**
 * Census aggregates.
 *
 * Every figure here is derived from the census records — nothing is stored and
 * nothing is hardcoded. These shapes are shared: the district-wide totals are
 * needed by the dashboard and by the reports, so they are defined once here
 * rather than once per consumer.
 */

/** District-wide record counts. */
export interface CensusTotals {
  townshipCount: number;
  townVillageCount: number;
  wardVillageCount: number;
  interviewCount: number;
  /** Rows in `answer`. */
  answerCount: number;
  /** Sum of every `answer.count` in the district. */
  livestockCount: number;
  /** Households that have at least one answer row. */
  householdsWithAnswers: number;
}

export interface MainCategoryStat {
  mainCategoryId: string;
  mainCategoryName: string;
  count: number;
}

export interface TownshipStat {
  townshipId: string;
  townshipName: string;
  interviewCount: number;
  livestockCount: number;
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  mainCategoryId: string;
  /** `null` when the category points at a main category that is not stored. */
  mainCategoryName: string | null;
  count: number;
}

export interface SexStat {
  /** `restriction.sex`, unchanged. */
  code: SexCode;
  /** Readable label, when one is known. */
  label: string | null;
  count: number;
}

/** One interview with the place it belongs to and what it counted. */
export interface RecentInterview {
  p_Id: number;
  h_name: string;
  ans_date: string;
  wvCode: string;
  villageName: string | null;
  tractName: string | null;
  townshipName: string | null;
  /** Sum of `answer.count` for this interview. */
  livestockCount: number;
}

export interface DashboardStatistics {
  totals: CensusTotals;
  /** One entry per township, including those with nothing recorded. */
  townships: TownshipStat[];
  mainCategories: MainCategoryStat[];
  categories: CategoryStat[];
  /** Only the sex codes that actually have records. */
  sexes: SexStat[];
  /** Most recently answered interviews first. */
  recentInterviews: RecentInterview[];
  /** The records these figures came from, for callers that need more. */
  records: CensusRecord[];
}