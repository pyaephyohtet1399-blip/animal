/**
 * Free-text matching.
 *
 * Case-insensitive substring matching, used by every search box so a query
 * behaves the same whether it is filtering places or census records. Myanmar has
 * no letter case, so lower-casing only affects Latin text — the codes and any
 * Romanised names.
 */

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