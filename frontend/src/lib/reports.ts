import type {
  AgeClassCode,
  RestrictionDimension,
  SexCode,
  SizeClassCode,
} from "@/types/census";
import type {
  CensusDataset,
  CensusRecord,
  CensusRecordFilters,
  FilterOption,
} from "@/types/census-records";
import type { LivestockAnswer } from "@/types/livestock";
import type { TownshipStat } from "@/types/statistics";
import { getSexCodeLabel } from "@/config ori/restriction";
import { childOptions, normalizeRecordFilters } from "@/lib/census";
import { readParam } from "@/lib/url";

/**
 * Reports.
 *
 * A report is a different *arrangement* of the census records, not different
 * data: every figure below is derived from records that pass the scope filters,
 * and a place with no matching records contributes a real zero rather than
 * disappearing or inventing a number.
 *
 * Row order is fixed — the place reports by primary measure descending then name
 * ascending, the livestock reports in `category` table order — so two printed
 * reports of the same scope can be compared line by line.
 */

export const REPORTS_HREF = "/reports";

export const REPORT_PARAMS = {
  township: "tsp",
  tract: "tvg",
  village: "wv",
  dateFrom: "from",
  dateTo: "to",
} as const;

/**
 * Reports narrow by place and date only. The search box and the animal-group
 * filters belong to the records table, not to a printed summary.
 */
export type ReportScope = Pick<
  CensusRecordFilters,
  "townshipCode" | "tractCode" | "villageCode" | "dateFrom" | "dateTo"
>;

export const EMPTY_REPORT_SCOPE: ReportScope = {
  townshipCode: null,
  tractCode: null,
  villageCode: null,
  dateFrom: null,
  dateTo: null,
};

export function parseReportScope(
  searchParams: Record<string, string | string[] | undefined>,
): ReportScope {
  return {
    townshipCode: readParam(searchParams[REPORT_PARAMS.township]),
    tractCode: readParam(searchParams[REPORT_PARAMS.tract]),
    villageCode: readParam(searchParams[REPORT_PARAMS.village]),
    dateFrom: readParam(searchParams[REPORT_PARAMS.dateFrom]),
    dateTo: readParam(searchParams[REPORT_PARAMS.dateTo]),
  };
}

export function buildReportHref(scope: ReportScope, overrides: Partial<ReportScope> = {}): string {
  const merged = { ...scope, ...overrides };
  const params = new URLSearchParams();

  if (merged.townshipCode) {
    params.set(REPORT_PARAMS.township, merged.townshipCode);
  }
  if (merged.tractCode) {
    params.set(REPORT_PARAMS.tract, merged.tractCode);
  }
  if (merged.villageCode) {
    params.set(REPORT_PARAMS.village, merged.villageCode);
  }
  if (merged.dateFrom) {
    params.set(REPORT_PARAMS.dateFrom, merged.dateFrom);
  }
  if (merged.dateTo) {
    params.set(REPORT_PARAMS.dateTo, merged.dateTo);
  }

  const search = params.toString();
  return search ? `${REPORTS_HREF}?${search}` : REPORTS_HREF;
}

export function hasReportScope(scope: ReportScope): boolean {
  return Boolean(
    scope.townshipCode ||
      scope.tractCode ||
      scope.villageCode ||
      scope.dateFrom ||
      scope.dateTo,
  );
}

/** Human-readable summary of the scope, printed on the report cover line. */
export function describeReportScope(scope: ReportScope, dataset: CensusDataset): string {
  const parts: string[] = [];

  if (scope.townshipCode) {
    parts.push(labelOf(dataset.townships, scope.townshipCode));
  }
  if (scope.tractCode) {
    parts.push(labelOf(dataset.tracts, scope.tractCode));
  }
  if (scope.villageCode) {
    parts.push(labelOf(dataset.villages, scope.villageCode));
  }
  if (scope.dateFrom || scope.dateTo) {
    parts.push(`${scope.dateFrom ?? "earliest"} to ${scope.dateTo ?? "latest"}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Whole district";
}

function labelOf(options: readonly FilterOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/* -------------------------------------------------------------------------- */
/* Report rows                                                                 */
/* -------------------------------------------------------------------------- */

/** Interview records and livestock counted in one township. */
export type TownshipReportRow = TownshipStat;

export interface TractReportRow {
  tractId: string;
  tractName: string;
  townshipId: string;
  townshipName: string;
  /** Villages in `ward_village` for this tract, whether or not they were surveyed. */
  villageCount: number;
  interviewCount: number;
  livestockCount: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  count: number;
}

export interface VillageReportRow {
  villageId: string;
  villageName: string;
  tractId: string;
  tractName: string;
  townshipName: string;
  interviewCount: number;
  livestockCount: number;
  /** Animals in this village per `main_category`, biggest first. */
  mainCategories: CategoryBreakdownItem[];
}

export interface LivestockCategoryReportRow {
  categoryId: string;
  categoryName: string;
  mainCategoryId: string;
  mainCategoryName: string;
  /** Every recorded animal of this type, which is the three sex figures added up. */
  count: number;
  /** `restriction.sex` breakdown of `count`. */
  male: number;
  castratedMale: number;
  female: number;
}

export interface SexReportRow {
  /** `restriction.sex`, unchanged. */
  code: SexCode;
  label: string | null;
  count: number;
}

export interface ReportTotals {
  interviewCount: number;
  livestockCount: number;
  answerCount: number;
  townshipCount: number;
  tractCount: number;
  villageCount: number;
}

/** Every report, for one scope. */
export interface ReportBundle {
  scope: ReportScope;
  scopeLabel: string;
  totals: ReportTotals;
  townships: TownshipReportRow[];
  tracts: TractReportRow[];
  villages: VillageReportRow[];
  categories: LivestockCategoryReportRow[];
  sexes: SexReportRow[];
  largeLivestock: LargeLivestockReportRow[];
  smallLivestock: SmallLivestockReportRow[];
  poultryLivestock: PoultryLivestockReportRow[];
  livestockSexSummary: LivestockSexSummaryRow[];
  mc1Large: LargeLivestockReportRow[];
  mc2Small: SmallLivestockReportRow[];
  mc3Poultry: PoultryLivestockReportRow[];
  mc4Summary: LivestockSexSummaryRow[];
}

/* -------------------------------------------------------------------------- */
/* Livestock census grids                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Age classes the census form records in years, and the ones it records in
 * months. Both lists are `restriction.age` codes that already exist: nothing
 * here invents a boundary, it only says which scale each stored answer was
 * counted on. A year answer goes to the large-animal grid and a month answer to
 * the small-animal grid, whichever animal type it belongs to, because the
 * restriction on the answer is the only record of that scale.
 */
export const YEAR_AGE_CLASS_CODES = [
  "LY1",
  "Y1B3",
  "GY3",
] as const satisfies readonly AgeClassCode[];
export type YearAgeClassCode = (typeof YEAR_AGE_CLASS_CODES)[number];

export const MONTH_AGE_CLASS_CODES = [
  "LM2",
  "M2B6",
  "GM6",
] as const satisfies readonly AgeClassCode[];
export type MonthAgeClassCode = (typeof MONTH_AGE_CLASS_CODES)[number];

/** Animals split the way `restriction.sex` splits them. */
export interface SexSplit {
  /** `M` */
  male: number;
  /** `MS` */
  castratedMale: number;
  /** `F` */
  female: number;
}

/** Which animal type a livestock row is about. */
export interface LivestockCategoryIdentity {
  categoryId: string;
  categoryName: string;
  mainCategoryId: string;
  mainCategoryName: string;
}

/** Animals counted on the year age classes, one row per animal type. */
export interface LargeLivestockReportRow extends LivestockCategoryIdentity {
  ageGroups: Record<YearAgeClassCode, SexSplit>;
  total: number;
}

/** Animals counted on the month age classes, one row per animal type. */
export interface SmallLivestockReportRow extends LivestockCategoryIdentity {
  ageGroups: Record<MonthAgeClassCode, SexSplit>;
  total: number;
}

/** Birds counted on size classes rather than age classes. */
export interface PoultryLivestockReportRow extends LivestockCategoryIdentity {
  sizeGroups: Record<SizeClassCode, SexSplit>;
  total: number;
}

/** Every recorded animal of a type, with no age or size column at all. */
export interface LivestockSexSummaryRow extends LivestockCategoryIdentity {
  male: number;
  castratedMale: number;
  female: number;
  total: number;
}

/* -------------------------------------------------------------------------- */
/* Building                                                                    */
/* -------------------------------------------------------------------------- */

interface Counters {
  interviewCount: number;
  livestockCount: number;
  answerCount: number;
}

function emptyCounters(): Counters {
  return { interviewCount: 0, livestockCount: 0, answerCount: 0 };
}

function tally(counters: Counters, record: CensusRecord) {
  counters.interviewCount += 1;
  counters.livestockCount += record.livestockCount;
  counters.answerCount += record.answerCount;
}

/* -------------------------------------------------------------------------- */
/* Livestock accumulation                                                        */
/* -------------------------------------------------------------------------- */

function emptySexSplit(): SexSplit {
  return { male: 0, castratedMale: 0, female: 0 };
}

/** Which `SexSplit` figure a stored sex code adds to. */
function sexSplitField(sex: SexCode): keyof SexSplit {
  switch (sex) {
    case "M":
      return "male";
    case "MS":
      return "castratedMale";
    case "F":
      return "female";
  }
}

/**
 * Male animals of a split, castrated ones included, for the grids that show two
 * sexes in one column. A castrated male is still a male, and leaving it out would
 * make the printed total disagree with the columns above it.
 */
export function maleTotal(split: SexSplit): number {
  return split.male + split.castratedMale;
}

/** The year age class an answer was counted on, if it was counted in years. */
function yearAgeClass(age: RestrictionDimension | null): YearAgeClassCode | null {
  switch (age) {
    case "LY1":
    case "Y1B3":
    case "GY3":
      return age;
    default:
      return null;
  }
}

/** The month age class an answer was counted on, if it was counted in months. */
function monthAgeClass(age: RestrictionDimension | null): MonthAgeClassCode | null {
  switch (age) {
    case "LM2":
    case "M2B6":
    case "GM6":
      return age;
    default:
      return null;
  }
}

/** The size class a bird was counted in, if it was counted by size. */
function sizeClass(age: RestrictionDimension | null): SizeClassCode | null {
  switch (age) {
    case "SMALL":
    case "MEDIUM":
    case "LARGE":
      return age;
    default:
      return null;
  }
}

function livestockIdentity(answer: LivestockAnswer): LivestockCategoryIdentity {
  return {
    categoryId: answer.categoryId,
    categoryName: answer.categoryName,
    mainCategoryId: answer.mainCategoryId,
    mainCategoryName: answer.mainCategoryName,
  };
}

/**
 * A row exists only once an answer of that animal type has been seen, so an
 * empty scope produces empty grids rather than rows full of zeros.
 */
function ensureLargeRow(
  rows: Map<string, LargeLivestockReportRow>,
  answer: LivestockAnswer,
): LargeLivestockReportRow {
  const existing = rows.get(answer.categoryId);
  if (existing) {
    return existing;
  }

  const created: LargeLivestockReportRow = {
    ...livestockIdentity(answer),
    ageGroups: { LY1: emptySexSplit(), Y1B3: emptySexSplit(), GY3: emptySexSplit() },
    total: 0,
  };
  rows.set(answer.categoryId, created);
  return created;
}

function ensureSmallRow(
  rows: Map<string, SmallLivestockReportRow>,
  answer: LivestockAnswer,
): SmallLivestockReportRow {
  const existing = rows.get(answer.categoryId);
  if (existing) {
    return existing;
  }

  const created: SmallLivestockReportRow = {
    ...livestockIdentity(answer),
    ageGroups: { LM2: emptySexSplit(), M2B6: emptySexSplit(), GM6: emptySexSplit() },
    total: 0,
  };
  rows.set(answer.categoryId, created);
  return created;
}

function ensurePoultryRow(
  rows: Map<string, PoultryLivestockReportRow>,
  answer: LivestockAnswer,
): PoultryLivestockReportRow {
  const existing = rows.get(answer.categoryId);
  if (existing) {
    return existing;
  }

  const created: PoultryLivestockReportRow = {
    ...livestockIdentity(answer),
    sizeGroups: { SMALL: emptySexSplit(), MEDIUM: emptySexSplit(), LARGE: emptySexSplit() },
    total: 0,
  };
  rows.set(answer.categoryId, created);
  return created;
}

function ensureSexSummaryRow(
  rows: Map<string, LivestockSexSummaryRow>,
  answer: LivestockAnswer,
): LivestockSexSummaryRow {
  const existing = rows.get(answer.categoryId);
  if (existing) {
    return existing;
  }

  const created: LivestockSexSummaryRow = {
    ...livestockIdentity(answer),
    male: 0,
    castratedMale: 0,
    female: 0,
    total: 0,
  };
  rows.set(answer.categoryId, created);
  return created;
}

/** Shared answer accumulation used by the record bundle and the dashboard. */
interface AnswerTally {
  categoryTotals: Map<string, LivestockCategoryReportRow>;
  sexTotals: Map<SexCode, number>;
  livestockSexSummaryRows: Map<string, LivestockSexSummaryRow>;
  largeLivestockRows: Map<string, LargeLivestockReportRow>;
  smallLivestockRows: Map<string, SmallLivestockReportRow>;
  poultryLivestockRows: Map<string, PoultryLivestockReportRow>;
  mc1LargeRows: Map<string, LargeLivestockReportRow>;
  mc2SmallRows: Map<string, SmallLivestockReportRow>;
  mc3PoultryRows: Map<string, PoultryLivestockReportRow>;
  mc4SummaryRows: Map<string, LivestockSexSummaryRow>;
}

function emptyAnswerTally(): AnswerTally {
  return {
    categoryTotals: new Map(),
    sexTotals: new Map(),
    livestockSexSummaryRows: new Map(),
    largeLivestockRows: new Map(),
    smallLivestockRows: new Map(),
    poultryLivestockRows: new Map(),
    mc1LargeRows: new Map(),
    mc2SmallRows: new Map(),
    mc3PoultryRows: new Map(),
    mc4SummaryRows: new Map(),
  };
}

function tallyAnswer(tally: AnswerTally, answer: LivestockAnswer): void {
  const sexField = sexSplitField(answer.sex);

  const existingCategory = tally.categoryTotals.get(answer.categoryId);
  if (existingCategory) {
    existingCategory.count += answer.count;
    existingCategory[sexField] += answer.count;
  } else {
    const created: LivestockCategoryReportRow = {
      ...livestockIdentity(answer),
      count: answer.count,
      male: 0,
      castratedMale: 0,
      female: 0,
    };
    created[sexField] += answer.count;
    tally.categoryTotals.set(answer.categoryId, created);
  }

  tally.sexTotals.set(answer.sex, (tally.sexTotals.get(answer.sex) ?? 0) + answer.count);

  // The four livestock grids all read the same stored answer.
  const summary = ensureSexSummaryRow(tally.livestockSexSummaryRows, answer);
  summary[sexField] += answer.count;
  summary.total += answer.count;

  const yearClass = yearAgeClass(answer.age);
  if (yearClass) {
    const large = ensureLargeRow(tally.largeLivestockRows, answer);
    large.ageGroups[yearClass][sexField] += answer.count;
    large.total += answer.count;
  }

  const monthClass = monthAgeClass(answer.age);
  if (monthClass) {
    const small = ensureSmallRow(tally.smallLivestockRows, answer);
    small.ageGroups[monthClass][sexField] += answer.count;
    small.total += answer.count;
  }

  const size = sizeClass(answer.age);
  if (size) {
    const bird = ensurePoultryRow(tally.poultryLivestockRows, answer);
    bird.sizeGroups[size][sexField] += answer.count;
    bird.total += answer.count;
  }

  // Per-animal-group grids for the four MC sections.
  const mainCategoryId = answer.mainCategoryId;
  if (mainCategoryId === "MC1" && yearClass) {
    const row = ensureLargeRow(tally.mc1LargeRows, answer);
    row.ageGroups[yearClass][sexField] += answer.count;
    row.total += answer.count;
  } else if (mainCategoryId === "MC2" && monthClass) {
    const row = ensureSmallRow(tally.mc2SmallRows, answer);
    row.ageGroups[monthClass][sexField] += answer.count;
    row.total += answer.count;
  } else if (mainCategoryId === "MC3" && size) {
    const row = ensurePoultryRow(tally.mc3PoultryRows, answer);
    row.sizeGroups[size][sexField] += answer.count;
    row.total += answer.count;
  } else if (mainCategoryId === "MC4") {
    const row = ensureSexSummaryRow(tally.mc4SummaryRows, answer);
    row[sexField] += answer.count;
    row.total += answer.count;
  }
}

function byCountDesc<T extends { count: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Places inside the scope, taken from the geography tables rather than from the
 * records, so a tract with no survey still reports its real village count and a
 * real zero.
 */
function scopeGeography(scope: ReportScope, dataset: CensusDataset) {
  const townships = scope.townshipCode
    ? dataset.townships.filter((option) => option.value === scope.townshipCode)
    : dataset.townships;

  const tracts = childOptions(dataset.tracts, scope.townshipCode);
  const tractIds = scope.tractCode
    ? tracts.filter((option) => option.value === scope.tractCode)
    : tracts;

  // A village list follows the whole scope: a pinned village, else the chosen
  // tract, else every village inside the chosen township, else the district.
  const tractIdSet = new Set(tractIds.map((option) => option.value));
  const villages = scope.villageCode
    ? childOptions(dataset.villages, scope.tractCode).filter(
        (option) => option.value === scope.villageCode,
      )
    : scope.townshipCode
      ? dataset.villages.filter(
          (option) => option.parentCode !== null && tractIdSet.has(option.parentCode),
        )
      : childOptions(dataset.villages, scope.tractCode);

  return { townships, tractIds, villages };
}

/**
 * Resolve a raw scope against the data, dropping impossible combinations and
 * filling in the parents a child implies.
 *
 * The records table does the same through `normalizeCensusState`; reports reuse
 * the shared record-filter validation and simply leave the animal-group fields
 * empty. `?tvg=` alone therefore reports on that township, not the whole
 * district.
 */
export function normalizeReportScope(
  scope: ReportScope,
  dataset: CensusDataset,
): ReportScope {
  const requestedTract = scope.tractCode ?? parentOf(dataset.villages, scope.villageCode);

  const requestedTownship =
    scope.townshipCode ??
    (requestedTract
      ? (dataset.tracts.find((option) => option.value === requestedTract)?.parentCode ?? null)
      : null);

  const normalized = normalizeRecordFilters(
    {
      query: "",
      townshipCode: requestedTownship,
      tractCode: requestedTract,
      villageCode: scope.villageCode,
      mainCategoryId: null,
      categoryId: null,
      dateFrom: scope.dateFrom,
      dateTo: scope.dateTo,
    },
    dataset,
  );

  return {
    townshipCode: normalized.townshipCode,
    tractCode: normalized.tractCode,
    villageCode: normalized.villageCode,
    dateFrom: normalized.dateFrom,
    dateTo: normalized.dateTo,
  };
}

/** `parentCode` of the matching option, used to derive an implied parent. */
function parentOf(
  options: readonly FilterOption[],
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }
  return options.find((option) => option.value === value)?.parentCode ?? null;
}

/** Records that pass the scope's place and date filters. */
export function selectScopedRecords(
  records: readonly CensusRecord[],
  scope: ReportScope,
): CensusRecord[] {
  return records.filter((record) => {
    if (scope.townshipCode && record.township?.code !== scope.townshipCode) {
      return false;
    }
    if (scope.tractCode && record.tract?.code !== scope.tractCode) {
      return false;
    }
    if (scope.villageCode && record.village?.code !== scope.villageCode) {
      return false;
    }

    const date = record.interview.ans_date;
    if (scope.dateFrom && date < scope.dateFrom) {
      return false;
    }
    if (scope.dateTo && date > scope.dateTo) {
      return false;
    }

    return true;
  });
}

/**
 * Build every report for a scope.
 *
 * The place reports are laid out over the geography tables and then filled from
 * the scoped records, so the structure is always real; the livestock reports
 * come only from the records, so they appear only when animals were counted.
 */
export function buildReportBundle(
  dataset: CensusDataset,
  rawScope: ReportScope,
): ReportBundle {
  const scope = normalizeReportScope(rawScope, dataset);
  const records = selectScopedRecords(dataset.records, scope);
  const geography = scopeGeography(scope, dataset);

  const townshipCounters = new Map<string, Counters>();
  const tractCounters = new Map<string, Counters>();
  const villageCounters = new Map<string, Counters>();

  const mainCategoryTotals = new Map<string, CategoryBreakdownItem>();
  const answerTally = emptyAnswerTally();

  for (const record of records) {
    if (record.township) {
      const key = record.township.code;
      const counters = townshipCounters.get(key) ?? emptyCounters();
      tally(counters, record);
      townshipCounters.set(key, counters);
    }

    if (record.tract) {
      const key = record.tract.code;
      const counters = tractCounters.get(key) ?? emptyCounters();
      tally(counters, record);
      tractCounters.set(key, counters);
    }

    if (record.village) {
      const key = record.village.code;
      const counters = villageCounters.get(key) ?? emptyCounters();
      tally(counters, record);
      villageCounters.set(key, counters);
    }

    for (const group of record.census.groups) {
      const existing = mainCategoryTotals.get(group.mainCategoryId);
      if (existing) {
        existing.count += group.answers.reduce((sum, answer) => sum + answer.count, 0);
      } else {
        mainCategoryTotals.set(group.mainCategoryId, {
          id: group.mainCategoryId,
          name: group.mainCategoryName,
          count: group.answers.reduce((sum, answer) => sum + answer.count, 0),
        });
      }

      for (const answer of group.answers) {
        tallyAnswer(answerTally, answer);
      }
    }
  }

  const townships: TownshipReportRow[] = geography.townships.map((township) => {
    const counters = townshipCounters.get(township.value);
    return {
      townshipId: township.value,
      townshipName: township.label,
      interviewCount: counters?.interviewCount ?? 0,
      livestockCount: counters?.livestockCount ?? 0,
    };
  });

  const villagesByTract = new Map<string, number>();
  for (const village of dataset.villages) {
    const parent = village.parentCode;
    if (!parent) {
      continue;
    }
    villagesByTract.set(parent, (villagesByTract.get(parent) ?? 0) + 1);
  }

  const tracts: TractReportRow[] = geography.tractIds.map((tract) => {
    const counters = tractCounters.get(tract.value);
    return {
      tractId: tract.value,
      tractName: tract.label,
      townshipId: tract.parentCode ?? "",
      townshipName: tract.parentCode ? labelOf(dataset.townships, tract.parentCode) : "—",
      villageCount: villagesByTract.get(tract.value) ?? 0,
      interviewCount: counters?.interviewCount ?? 0,
      livestockCount: counters?.livestockCount ?? 0,
    };
  });

  const mainCategoryByVillage = new Map<string, Map<string, CategoryBreakdownItem>>();

  for (const record of records) {
    const villageCode = record.village?.code;
    if (!villageCode) {
      continue;
    }

    const perVillage = mainCategoryByVillage.get(villageCode) ?? new Map();
    for (const group of record.census.groups) {
      const groupCount = group.answers.reduce((sum, answer) => sum + answer.count, 0);
      const existing = perVillage.get(group.mainCategoryId);
      if (existing) {
        existing.count += groupCount;
      } else {
        perVillage.set(group.mainCategoryId, {
          id: group.mainCategoryId,
          name: group.mainCategoryName,
          count: groupCount,
        });
      }
    }
    mainCategoryByVillage.set(villageCode, perVillage);
  }

  const villages: VillageReportRow[] = geography.villages.map((village) => {
    const counters = villageCounters.get(village.value);
    return {
      villageId: village.value,
      villageName: village.label,
      tractId: village.parentCode ?? "",
      tractName: village.parentCode ? labelOf(dataset.tracts, village.parentCode) : "—",
      townshipName: townshipNameOfVillage(dataset, village.value),
      interviewCount: counters?.interviewCount ?? 0,
      livestockCount: counters?.livestockCount ?? 0,
      mainCategories: byCountDesc([...(mainCategoryByVillage.get(village.value)?.values() ?? [])]),
    };
  });

  const categories = [...answerTally.categoryTotals.values()].sort(
    (a, b) => b.count - a.count || a.categoryName.localeCompare(b.categoryName),
  );

  const sexes: SexReportRow[] = [...answerTally.sexTotals.entries()]
    .map(([code, count]) => ({ code, label: getSexCodeLabel(code), count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  // The livestock grids follow the census form: animal groups in `main_category`
  // order, animal types in `category` order.
  const inTaxonomyOrder = byTaxonomyOrder(dataset);

  const totals: ReportTotals = {
    interviewCount: records.length,
    livestockCount: records.reduce((sum, record) => sum + record.livestockCount, 0),
    answerCount: records.reduce((sum, record) => sum + record.answerCount, 0),
    townshipCount: townships.length,
    tractCount: tracts.length,
    villageCount: villages.length,
  };

  return {
    scope,
    scopeLabel: describeReportScope(scope, dataset),
    totals,
    townships: sortByMeasure(townships, "livestockCount", "townshipName"),
    tracts: sortByMeasure(tracts, "livestockCount", "tractName"),
    villages: sortByMeasure(villages, "livestockCount", "villageName"),
    categories,
    sexes,
    largeLivestock: inTaxonomyOrder([...answerTally.largeLivestockRows.values()]),
    smallLivestock: inTaxonomyOrder([...answerTally.smallLivestockRows.values()]),
    poultryLivestock: inTaxonomyOrder([...answerTally.poultryLivestockRows.values()]),
    livestockSexSummary: inTaxonomyOrder([...answerTally.livestockSexSummaryRows.values()]),
    mc1Large: inTaxonomyOrder([...answerTally.mc1LargeRows.values()]),
    mc2Small: inTaxonomyOrder([...answerTally.mc2SmallRows.values()]),
    mc3Poultry: inTaxonomyOrder([...answerTally.mc3PoultryRows.values()]),
    mc4Summary: inTaxonomyOrder([...answerTally.mc4SummaryRows.values()]),
  };
}

/** Primary measure descending, name ascending, so the order is reproducible. */
function sortByMeasure<T, K extends keyof T>(rows: T[], measure: K, name: K): T[] {
  return [...rows].sort(
    (a, b) =>
      Number(b[measure]) - Number(a[measure]) ||
      String(a[name]).localeCompare(String(b[name])),
  );
}

/**
 * Animal groups in `main_category` order, then animal types in `category` order,
 * so a livestock grid reads like the form it came from.
 */
function taxonomySorter(
  groupOrder: Map<string, number>,
  categoryOrder: Map<string, number>,
) {
  const rank = (order: Map<string, number>, key: string): number =>
    order.get(key) ?? Number.MAX_SAFE_INTEGER;

  return <TRow extends LivestockCategoryIdentity>(rows: TRow[]): TRow[] =>
    [...rows].sort((a, b) => {
      const byGroup = rank(groupOrder, a.mainCategoryId) - rank(groupOrder, b.mainCategoryId);
      if (byGroup !== 0) {
        return byGroup;
      }
      const byCategory = rank(categoryOrder, a.categoryId) - rank(categoryOrder, b.categoryId);
      return byCategory !== 0 ? byCategory : a.categoryName.localeCompare(b.categoryName);
    });
}

function byTaxonomyOrder(dataset: CensusDataset) {
  return taxonomySorter(
    new Map(dataset.mainCategories.map((option, index) => [option.value, index])),
    new Map(dataset.categories.map((option, index) => [option.value, index])),
  );
}

export interface AnswerAggregates {
  categories: LivestockCategoryReportRow[];
  mc1Large: LargeLivestockReportRow[];
  mc2Small: SmallLivestockReportRow[];
  mc3Poultry: PoultryLivestockReportRow[];
  mc4Summary: LivestockSexSummaryRow[];
}

/**
 * The category grids from a flat list of already-resolved answers — the
 * dashboard feeds it server-aggregated rows through the same accumulation the
 * report bundle uses, so both screens always agree on the numbers.
 */
export function buildAnswerAggregates(
  answers: LivestockAnswer[],
  groupOrder: Map<string, number>,
  categoryOrder: Map<string, number>,
): AnswerAggregates {
  const tally = emptyAnswerTally();
  for (const answer of answers) {
    tallyAnswer(tally, answer);
  }

  const inTaxonomyOrder = taxonomySorter(groupOrder, categoryOrder);

  return {
    categories: [...tally.categoryTotals.values()].sort(
      (a, b) => b.count - a.count || a.categoryName.localeCompare(b.categoryName),
    ),
    mc1Large: inTaxonomyOrder([...tally.mc1LargeRows.values()]),
    mc2Small: inTaxonomyOrder([...tally.mc2SmallRows.values()]),
    mc3Poultry: inTaxonomyOrder([...tally.mc3PoultryRows.values()]),
    mc4Summary: inTaxonomyOrder([...tally.mc4SummaryRows.values()]),
  };
}

function townshipNameOfVillage(dataset: CensusDataset, villageCode: string): string {
  const village = dataset.villages.find((option) => option.value === villageCode);
  if (!village?.parentCode) {
    return "—";
  }
  const tract = dataset.tracts.find((option) => option.value === village.parentCode);
  return tract?.parentCode ? labelOf(dataset.townships, tract.parentCode) : "—";
}