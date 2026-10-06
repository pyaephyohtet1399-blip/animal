import { matchesTerms } from "@/lib/search";
import {
  EMPTY_SELECTION,
  type ExplorerSelection,
  type LocationNode,
} from "@/types/explorer";

/** The explorer's own route. Every selection is expressed as query parameters. */
export const EXPLORER_HREF = "/explorer";

/**
 * Village detail page. The village code is enough on its own because the tract
 * and township above it are resolved from the same rows server-side.
 */
export function buildVillageHref(wvCode: string): string {
  return `${EXPLORER_HREF}/${encodeURIComponent(wvCode)}`;
}

/** Query parameter per level. Short because they appear in shared URLs. */
export const EXPLORER_PARAMS = {
  township: "tsp",
  townVillage: "tvg",
  wardVillage: "wv",
} as const;

/**
 * Explorer selection lives in the URL rather than in component state, so a
 * location can be bookmarked, shared and reached with the back button.
 *
 * These helpers are the only place that mapping is written, so the page, the
 * breadcrumb and the explorer columns can never disagree about it.
 */

/** Read a single query parameter, ignoring blanks and repeated values. */
export function readParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

/** Build the explorer URL for a selection. Deeper codes imply their parents. */
export function buildExplorerHref(selection: Partial<ExplorerSelection>): string {
  const params = new URLSearchParams();

  if (selection.townshipCode) {
    params.set(EXPLORER_PARAMS.township, selection.townshipCode);
  }
  if (selection.townVillageCode) {
    params.set(EXPLORER_PARAMS.townVillage, selection.townVillageCode);
  }
  if (selection.wardVillageCode) {
    params.set(EXPLORER_PARAMS.wardVillage, selection.wardVillageCode);
  }

  const query = params.toString();
  return query ? `${EXPLORER_HREF}?${query}` : EXPLORER_HREF;
}

/** Read the selection out of a page's `searchParams`. */
export function parseExplorerSelection(
  searchParams: Record<string, string | string[] | undefined>,
): ExplorerSelection {
  return {
    townshipCode: readParam(searchParams[EXPLORER_PARAMS.township]),
    townVillageCode: readParam(searchParams[EXPLORER_PARAMS.townVillage]),
    wardVillageCode: readParam(searchParams[EXPLORER_PARAMS.wardVillage]),
  };
}

/**
 * Drop the deepest selected level, keeping everything above it. This is the
 * "back one level" control: village -> tract -> township -> everything.
 */
export function stepUp(selection: ExplorerSelection): ExplorerSelection {
  if (selection.wardVillageCode) {
    return { ...selection, wardVillageCode: null };
  }
  if (selection.townVillageCode) {
    return { ...selection, townVillageCode: null, wardVillageCode: null };
  }
  return { ...EMPTY_SELECTION };
}

/** Whether any level is selected, i.e. whether the lists are scoped. */
export function isScoped(selection: ExplorerSelection): boolean {
  return Boolean(
    selection.townshipCode || selection.townVillageCode || selection.wardVillageCode,
  );
}

/**
 * Filter one level's locations by name or code.
 *
 * Returns a new array so callers can safely memoise the result.
 */
export function filterLocations(
  nodes: readonly LocationNode[],
  query: string,
): LocationNode[] {
  return nodes.filter((node) => matchesTerms([node.name, node.code], query));
}
