/**
 * Free-text matching.
 *
 * Case-insensitive substring matching, used by every search box so a query
 * behaves the same whether it is filtering places or census records. Myanmar has
 * no letter case, so lower-casing only affects Latin text — the codes and any
 * Romanised names.
 */

/**
 * Myanmar-locale ordering for place names.
 *
 * The API returns locations in code order, which reads as random in a column
 * or a dropdown. One collator keeps every list — search results, explorer
 * columns, filter selects — in the same က-ခ-ဂ order a reader expects.
 * `sensitivity: "base"` treats names that differ only in tone marks as equal,
 * and `Array.prototype.sort` is stable, so ties keep their code order.
 */
const NAME_COLLATOR = new Intl.Collator("my", { usage: "sort", sensitivity: "base" });

/** Alphabetical (Burmese) order for two display names. */
export function compareNames(a: string | null | undefined, b: string | null | undefined): number {
  return NAME_COLLATOR.compare(a ?? "", b ?? "");
}

/** Normalised form used on both sides of a comparison. */
export function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Whether any of `terms` contains `query`. An empty query matches everything, so
 * callers do not need a separate "no filter" branch.
 */
export function matchesTerms(terms: readonly (string | null | undefined)[], query: string): boolean {
  const needle = normalizeTerm(query);
  if (!needle) {
    return true;
  }

  return terms.some((term) => term && term.toLowerCase().includes(needle));
}