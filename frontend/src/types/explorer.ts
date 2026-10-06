/**
 * Explorer domain models.
 *
 * The three geography tables (`township`, `town_vg`, `ward_village`) differ
 * only in the name of their code column, so the explorer works against a single
 * normalized shape. `code` is always the level's own code column and
 * `parentCode` is the code it belongs to at the level above, which is `null`
 * for the root level. No value is invented here — every field is a column that
 * already exists in the source tables.
 */

export const EXPLORER_LEVELS = ["township", "townVillage", "wardVillage"] as const;

/** Explorer levels, top to bottom. */
export type ExplorerLevel = (typeof EXPLORER_LEVELS)[number];

/** A place in the census hierarchy, identified by its own code. */
export interface PlaceRef {
  code: string;
  name: string;
}

/** One row of any explorer level: a place plus the level it belongs to. */
export interface LocationNode extends PlaceRef {
  /** Owning code from the level above; `null` for the root level. */
  parentCode: string | null;
}

/**
 * Currently selected branch of the hierarchy. A code is only kept when it
 * actually exists and belongs to its parent, so the selection can never
 * describe an impossible branch.
 */
export interface ExplorerSelection {
  townshipCode: string | null;
  townVillageCode: string | null;
  wardVillageCode: string | null;
}

/** The district is the fixed root of the explorer and is never selectable. */
export const EMPTY_SELECTION: ExplorerSelection = {
  townshipCode: null,
  townVillageCode: null,
  wardVillageCode: null,
};
