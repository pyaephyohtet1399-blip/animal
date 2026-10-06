/**
 * Query-string helpers shared by every screen that keeps its state in the URL.
 *
 * Pages read their state through `searchParams`; these functions turn one into
 * usable values and back again, so no screen has to repeat the "ignore blanks
 * and repeated values" rule.
 */

/** Read a single query parameter, ignoring blanks and repeated values. */
export function readParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

/** Read a 1-based page number, falling back to the first page. */
export function readPage(value: string | string[] | undefined): number {
  const page = Number.parseInt(readParam(value) ?? "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/** Set a parameter only when it has a value, so URLs stay short. */
export function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | number | null | undefined,
): void {
  if (value !== null && value !== undefined && value !== "") {
    params.set(key, String(value));
  }
}