import type { RestrictionDimension, SexCode } from "@/types/census";

/**
 * One `answer` row with every foreign key it points at already resolved.
 *
 * The DML stores only `p_Id`, `cat_id` and `rid`. The names come from
 * `category`, `main_category` and `restriction`, and the join is done once in
 * the data layer so no component has to know the relationship exists.
 */
export interface LivestockAnswer {
  /** `answer.id` */
  id: number;
  /** `answer.count`, exactly as recorded. Never recalculated. */
  count: number;
  /** `category.cat_id` */
  categoryId: string;
  /** `category.cat_name` */
  categoryName: string;
  /** `main_category.mcat_id` */
  mainCategoryId: string;
  /** `main_category.name` */
  mainCategoryName: string;
  /** `restriction.rid` */
  restrictionId: number;
  /** `restriction.age`; `null` when the restriction is not age or size bound. */
  age: RestrictionDimension | null;
  /** `restriction.sex` */
  sex: SexCode;
}

/** Answers for one interview, split by the main category they belong to. */
export interface LivestockGroup {
  mainCategoryId: string;
  mainCategoryName: string;
  answers: LivestockAnswer[];
}

/** Everything the interview detail needs about one household's livestock. */
export interface LivestockCensus {
  /** Groups in `main_category` order. */
  groups: LivestockGroup[];
  /**
   * Sum of `answer.count` over every row stored for this interview. This is a
   * calculation over the stored counts, not a stored value.
   */
  totalCount: number;
  /** Rows in `answer` for this interview. */
  answerCount: number;
  /**
   * Rows that could not be matched to a category or a restriction, so they are
   * not listed. They are still part of `totalCount`, and the UI says so.
   */
  unresolvedCount: number;
}

export const EMPTY_LIVESTOCK_CENSUS: LivestockCensus = {
  groups: [],
  totalCount: 0,
  answerCount: 0,
  unresolvedCount: 0,
};
