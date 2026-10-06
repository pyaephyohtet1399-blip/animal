import {
  type CensusDataset,
  type CensusFilterState,
  type CensusRecord,
  type CensusRecordFilters,
  type CensusSortKey,
  type FilterOption,
} from "@/types/census-records";
import { appendParam, readPage, readParam } from "@/lib/url";
import { matchesTerms } from "@/lib/search";

/**
 * Query state for `/census`, held entirely in the URL.
 *
 * Every function here is pure: given records and a state, they return records.
 * Nothing reads the request or the router, which is what lets the same code run
 * today over mock JSON and later over an API response.
 */

export const CENSUS_HREF = "/census";

export const CENSUS_PARAMS = {
  query: "q",
  township: "tsp",
  tract: "tvg",
  village: "wv",
  mainCategory: "mc",
  category: "cat",
  dateFrom: "from",
  dateTo: "to",
  sort: "sort",
  direction: "dir",
  page: "page",
} as const;

/**
 * Rows per page. Small on purpose: the mock dataset is tiny, but the paging is
 * the real thing, so swapping this for a server `limit` later changes nothing
 * above it.
 */
export const CENSUS_PAGE_SIZE = 5;

export const CENSUS_SORT_KEYS: CensusSortKey[] = [
  "h_name",
  "township",
  "tract",
  "village",
  "ans_date",
  "livestock",
];

export const DEFAULT_CENSUS_STATE: CensusFilterState = {
  query: "",
  townshipCode: null,
  tractCode: null,
  villageCode: null,
  mainCategoryId: null,
  categoryId: null,
  dateFrom: null,
  dateTo: null,
  sort: { key: "ans_date", direction: "desc" },
  page: 1,
};

/* ------------------------------------------------------------------ reading */

function readSort(
  key: string | string[] | undefined,
  direction: string | string[] | undefined,
): CensusFilterState["sort"] {
  const rawKey = readParam(key);
  const sortKey = CENSUS_SORT_KEYS.find((candidate) => candidate === rawKey);

  if (!sortKey) {
    return { ...DEFAULT_CENSUS_STATE.sort };
  }

  return {
    key: sortKey,
    direction: readParam(direction) === "asc" ? "asc" : "desc",
  };
}

/** Read the query out of a page's `searchParams`. Nothing is validated yet. */
export function parseCensusState(
  searchParams: Record<string, string | string[] | undefined>,
): CensusFilterState {
  return {
    query: readParam(searchParams[CENSUS_PARAMS.query]) ?? "",
    townshipCode: readParam(searchParams[CENSUS_PARAMS.township]),
    tractCode: readParam(searchParams[CENSUS_PARAMS.tract]),
    villageCode: readParam(searchParams[CENSUS_PARAMS.village]),
    mainCategoryId: readParam(searchParams[CENSUS_PARAMS.mainCategory]),
    categoryId: readParam(searchParams[CENSUS_PARAMS.category]),
    dateFrom: readParam(searchParams[CENSUS_PARAMS.dateFrom]),
    dateTo: readParam(searchParams[CENSUS_PARAMS.dateTo]),
    sort: readSort(
      searchParams[CENSUS_PARAMS.sort],
      searchParams[CENSUS_PARAMS.direction],
    ),
    page: readPage(searchParams[CENSUS_PARAMS.page]),
  };
}

/* ------------------------------------------------------------------ writing */

/** URL for a state, with optional overrides applied on top. */
export function buildCensusHref(
  state: CensusFilterState,
  overrides: Partial<CensusFilterState> = {},
): string {
  const merged = { ...state, ...overrides };
  const params = new URLSearchParams();

  appendParam(params, CENSUS_PARAMS.query, merged.query.trim() || null);
  appendParam(params, CENSUS_PARAMS.township, merged.townshipCode);
  appendParam(params, CENSUS_PARAMS.tract, merged.tractCode);
  appendParam(params, CENSUS_PARAMS.village, merged.villageCode);
  appendParam(params, CENSUS_PARAMS.mainCategory, merged.mainCategoryId);
  appendParam(params, CENSUS_PARAMS.category, merged.categoryId);
  appendParam(params, CENSUS_PARAMS.dateFrom, merged.dateFrom);
  appendParam(params, CENSUS_PARAMS.dateTo, merged.dateTo);
  appendParam(params, CENSUS_PARAMS.sort, merged.sort.key);
  appendParam(params, CENSUS_PARAMS.direction, merged.sort.direction);

  if (merged.page > 1) {
    params.set(CENSUS_PARAMS.page, String(merged.page));
  }

  const search = params.toString();
  return search ? `${CENSUS_HREF}?${search}` : CENSUS_HREF;
}

/** Whether any filter, search term or date bound narrows the table. */
export function hasActiveFilters(filters: CensusRecordFilters): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.townshipCode ||
      filters.tractCode ||
      filters.villageCode ||
      filters.mainCategoryId ||
      filters.categoryId ||
      filters.dateFrom ||
      filters.dateTo,
  );
}

/* --------------------------------------------------------------- normalising */

function optionExists(options: readonly FilterOption[], value: string | null): boolean {
  return value !== null && options.some((option) => option.value === value);
}

function belongsTo(
  options: readonly FilterOption[],
  value: string | null,
  parent: string | null,
): boolean {
  if (!optionExists(options, value)) {
    return false;
  }
  if (!parent) {
    return true;
  }
  return options.find((option) => option.value === value)?.parentCode === parent;
}

/** Values of `options` whose parent is `parent`. */
export function childOptions(
  options: readonly FilterOption[],
  parent: string | null,
): FilterOption[] {
  if (!parent) {
    return [...options];
  }
  return options.filter((option) => option.parentCode === parent);
}

/**
 * Drop any selection the data does not support.
 *
 * A hand-edited or stale URL can pair a tract with the wrong township, or ask
 * for a category outside the chosen animal group. Rather than render a filter
 * that silently matches nothing, the impossible part is cleared and the rest of
 * the query is kept.
 *
 * Shared with the reports, which narrow by place and date but not by animal
 * group, so they get the same guarantees for the filters they do use.
 */
export function normalizeRecordFilters(
  filters: CensusRecordFilters,
  dataset: CensusDataset,
): CensusRecordFilters {
  const townshipCode = belongsTo(dataset.townships, filters.townshipCode, null)
    ? filters.townshipCode
    : null;

  const tractCode = belongsTo(dataset.tracts, filters.tractCode, townshipCode)
    ? filters.tractCode
    : null;

  // A village may be pinned to a tract, or — with no tract chosen — to any tract
  // inside the chosen township.
  const villageValid = tractCode
    ? belongsTo(dataset.villages, filters.villageCode, tractCode)
    : villageCodeInScope(dataset, filters.villageCode, townshipCode);
  const villageCode = villageValid ? filters.villageCode : null;

  const mainCategoryId = belongsTo(dataset.mainCategories, filters.mainCategoryId, null)
    ? filters.mainCategoryId
    : null;

  const categoryId = belongsTo(dataset.categories, filters.categoryId, mainCategoryId)
    ? filters.categoryId
    : null;

  const dateFrom = optionExists(dataset.dates, filters.dateFrom) ? filters.dateFrom : null;
  const dateTo = optionExists(dataset.dates, filters.dateTo) ? filters.dateTo : null;

  // An inverted range would match nothing; keep the lower bound and drop the rest.
  const bounds = normalizeDateBounds(dateFrom, dateTo);

  return {
    ...filters,
    townshipCode,
    tractCode,
    villageCode,
    mainCategoryId,
    categoryId,
    dateFrom: bounds.dateFrom,
    dateTo: bounds.dateTo,
  };
}

/** As `normalizeRecordFilters`, plus a checked sort key and page. */
export function normalizeCensusState(
  state: CensusFilterState,
  dataset: CensusDataset,
): CensusFilterState {
  return { ...state, ...normalizeRecordFilters(state, dataset) };
}

function villageCodeInScope(
  dataset: CensusDataset,
  villageCode: string | null,
  townshipCode: string | null,
): boolean {
  if (!optionExists(dataset.villages, villageCode)) {
    return false;
  }
  if (!townshipCode) {
    return true;
  }

  const tractCode = dataset.villages.find(
    (option) => option.value === villageCode,
  )?.parentCode;

  return belongsTo(dataset.tracts, tractCode ?? null, townshipCode);
}

function normalizeDateBounds(
  dateFrom: string | null,
  dateTo: string | null,
): { dateFrom: string | null; dateTo: string | null } {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return { dateFrom, dateTo: null };
  }
  return { dateFrom, dateTo };
}

/* ---------------------------------------------------------------- filtering */

/** The values the records free-text search looks at: the four human-facing fields. */
function searchHaystack(record: CensusRecord): (string | null | undefined)[] {
  return [
    record.interview.h_name,
    record.village?.name,
    record.village?.code,
    record.tract?.name,
    record.tract?.code,
    record.township?.name,
    record.township?.code,
  ];
}

export function matchesCensusQuery(record: CensusRecord, query: string): boolean {
  return matchesTerms(searchHaystack(record), query);
}

/** Apply every filter. The order matches the order the toolbar lays them out. */
export function filterCensusRecords(
  records: readonly CensusRecord[],
  filters: CensusRecordFilters,
): CensusRecord[] {
  return records.filter((record) => {
    if (!matchesCensusQuery(record, filters.query)) {
      return false;
    }
    if (filters.townshipCode && record.township?.code !== filters.townshipCode) {
      return false;
    }
    if (filters.tractCode && record.tract?.code !== filters.tractCode) {
      return false;
    }
    if (filters.villageCode && record.village?.code !== filters.villageCode) {
      return false;
    }
    if (
      filters.mainCategoryId &&
      !record.mainCategoryIds.includes(filters.mainCategoryId)
    ) {
      return false;
    }
    if (filters.categoryId && !record.categoryIds.includes(filters.categoryId)) {
      return false;
    }

    const date = record.interview.ans_date;
    if (filters.dateFrom && date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && date > filters.dateTo) {
      return false;
    }

    return true;
  });
}

/* ------------------------------------------------------------------ sorting */

const SORT_ACCESSORS: Record<CensusSortKey, (record: CensusRecord) => string | number> = {
  h_name: (record) => record.interview.h_name,
  township: (record) => record.township?.name ?? "",
  tract: (record) => record.tract?.name ?? "",
  village: (record) => record.village?.name ?? "",
  ans_date: (record) => record.interview.ans_date,
  livestock: (record) => record.livestockCount,
};

/**
 * Sort on the requested column. `p_Id` breaks every tie so the order is stable
 * and repeatable instead of depending on the input order.
 */
export function sortCensusRecords(
  records: readonly CensusRecord[],
  sort: CensusFilterState["sort"],
): CensusRecord[] {
  const accessor = SORT_ACCESSORS[sort.key];
  const factor = sort.direction === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    const left = accessor(a);
    const right = accessor(b);

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor || (a.interview.p_Id - b.interview.p_Id);
    }

    return (
      String(left).localeCompare(String(right)) * factor ||
      (a.interview.p_Id - b.interview.p_Id)
    );
  });
}


/* --------------------------------------------------------------- pagination */

export interface Page<T> {
  rows: T[];
  page: number;
  pageCount: number;
  total: number;
  /** 1-based index of the first row on this page, or 0 when empty. */
  from: number;
  to: number;
}

/**
 * Client-side paging. The page is clamped into range, so a `?page=99` left over
 * from a longer result set lands on the last page instead of an empty table.
 */
export function paginate<T>(rows: readonly T[], page: number, pageSize: number): Page<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return {
    rows: pageRows,
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + pageRows.length,
  };
}

/** Filtering, sorting and paging in the order a table applies them. */
export function selectCensusPage(
  records: readonly CensusRecord[],
  state: CensusFilterState,
): Page<CensusRecord> {
  const filtered = filterCensusRecords(records, state);
  return paginate(sortCensusRecords(filtered, state.sort), state.page, CENSUS_PAGE_SIZE);
}