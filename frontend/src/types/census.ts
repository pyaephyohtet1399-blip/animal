/**
 * Domain models for the Livestock Census Management System.
 *
 * Scope rule: every type in this file mirrors a column that exists in the
 * project SQL/DML. No field is invented here. These are the only definitions of
 * these entities — features import them rather than re-declaring a local shape.
 */

/* -------------------------------------------------------------------------- */
/* Geography                                                                   */
/* -------------------------------------------------------------------------- */

export interface Township {
  tspCode: string;
  tspName: string;
}

export interface TownVillage {
  tvgCode: string;
  tvgName: string;
  tspCode: string;
}

export interface WardVillage {
  wvCode: string;
  wvName: string;
  tvgCode: string;
}

/* -------------------------------------------------------------------------- */
/* Interview / household                                                       */
/* -------------------------------------------------------------------------- */

export interface InterviewInfo {
  p_Id: number;
  h_name: string;
  h_edu: string;
  h_gender: string;
  h_phone: string;
  h_age: number;
  /** ISO date string (YYYY-MM-DD). */
  ans_date: string;
  wvCode: string;
}

/* -------------------------------------------------------------------------- */
/* Animal taxonomy                                                             */
/* -------------------------------------------------------------------------- */

export interface MainCategory {
  mcat_id: string;
  name: string;
}

export interface Category {
  cat_id: string;
  cat_name: string;
  mcat_id: string;
}

/** Age class codes used by the restriction table. */
export const AGE_CLASS_CODES = ["LY1", "Y1B3", "GY3", "LM2", "M2B6", "GM6"] as const;
export type AgeClassCode = (typeof AGE_CLASS_CODES)[number];

/** Size class codes used by the restriction table. */
export const SIZE_CLASS_CODES = ["SMALL", "MEDIUM", "LARGE"] as const;
export type SizeClassCode = (typeof SIZE_CLASS_CODES)[number];

/**
 * The `restriction.age` column carries either an age class code or a size
 * class code, depending on the animal type.
 */
export type RestrictionDimension = AgeClassCode | SizeClassCode;

/** Sex codes used by the restriction table. */
export const SEX_CODES = ["M", "MS", "F"] as const;
export type SexCode = (typeof SEX_CODES)[number];

export interface Restriction {
  rid: number;
  /** `null` means the row is not age/size bound. */
  age: RestrictionDimension | null;
  sex: SexCode;
}

/* -------------------------------------------------------------------------- */
/* Census answers                                                              */
/* -------------------------------------------------------------------------- */

export interface Answer {
  id: number;
  p_Id: number;
  cat_id: string;
  rid: number;
  count: number;
}

/**
 * The `user` table is intentionally not typed yet: `src/data/user.json` ships
 * with zero records, so its columns are unknown. The type will be added when the
 * real schema is provided.
 */