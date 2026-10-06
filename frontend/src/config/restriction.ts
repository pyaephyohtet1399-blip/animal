import type {
  AgeClassCode,
  RestrictionDimension,
  SexCode,
  SizeClassCode,
} from "@/types/census";

/**
 * Readable labels for the codes stored in `restriction`.
 *
 * The stored code is always displayed unchanged; these labels sit beside it for
 * the reader. The DML does not define the codes, so anything without a
 * confident expansion is left out of the map and rendered as the bare code
 * rather than guessed at.
 */

export const AGE_CLASS_LABELS = {
  LY1: "Under 1 year",
  Y1B3: "1 to 3 years",
  GY3: "Over 3 years",
  LM2: "Under 2 months",
  M2B6: "2 to 6 months",
  GM6: "Over 6 months",
} satisfies Record<AgeClassCode, string>;

export const SIZE_CLASS_LABELS = {
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
} satisfies Record<SizeClassCode, string>;

/** Both code sets share one lookup because the column accepts either. */
export const RESTRICTION_DIMENSION_LABELS = {
  ...AGE_CLASS_LABELS,
  ...SIZE_CLASS_LABELS,
} satisfies Record<RestrictionDimension, string>;

/**
 * `MS` is stored but never defined in the DML, so it is deliberately absent and
 * rendered as the bare code. Add it here once its meaning is confirmed.
 */
export const SEX_CODE_LABELS: Partial<Record<SexCode, string>> = {
  M: "Male",
  F: "Female",
};

/** Shown in place of a code when `restriction.age` is `null`. */
export const NOT_AGE_BOUND = "—";

export function getRestrictionDimensionLabel(
  dimension: RestrictionDimension | null,
): string | null {
  return dimension === null ? null : RESTRICTION_DIMENSION_LABELS[dimension];
}

export function getSexCodeLabel(sex: SexCode): string | null {
  return SEX_CODE_LABELS[sex] ?? null;
}
