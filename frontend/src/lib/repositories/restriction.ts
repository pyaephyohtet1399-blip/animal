import restrictionJson from "@/data/restriction.json";
import {
  AGE_CLASS_CODES,
  SEX_CODES,
  SIZE_CLASS_CODES,
  type Restriction,
  type RestrictionDimension,
  type SexCode,
} from "@/types/census";

function invalidRow(field: string, value: string, rid: number): never {
  throw new Error(
    `Invalid value "${value}" in restriction.json field "${field}" (rid: ${rid}).`,
  );
}

function toRestrictionDimension(value: string, rid: number): RestrictionDimension {
  const isKnown = [...AGE_CLASS_CODES, ...SIZE_CLASS_CODES] as readonly string[];
  if (!isKnown.includes(value)) {
    invalidRow("age", value, rid);
  }
  return value as RestrictionDimension;
}

function toSexCode(value: string, rid: number): SexCode {
  if (!(SEX_CODES as readonly string[]).includes(value)) {
    invalidRow("sex", value, rid);
  }
  return value as SexCode;
}

/**
 * Data access for the `restriction` table.
 *
 * The JSON import widens `age` to `string | null`, so rows are validated here
 * and narrowed to the domain union instead of being cast blindly.
 */
export async function getRestrictions(): Promise<Restriction[]> {
  return restrictionJson.map((row) => ({
    rid: row.rid,
    age: row.age === null ? null : toRestrictionDimension(row.age, row.rid),
    sex: toSexCode(row.sex, row.rid),
  }));
}
