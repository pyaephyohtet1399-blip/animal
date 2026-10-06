import { getTownVillageByCode, getTownVillages } from "@/lib/repositories/town-village";
import { getTownshipByCode, getTownships } from "@/lib/repositories/township";
import {
  getWardVillageByCode,
  getWardVillages,
} from "@/lib/repositories/ward-village";
import type { ExplorerSelection, LocationNode } from "@/types/explorer";

/**
 * Data access for the geographic explorer.
 *
 * `township`, `town_vg` and `ward_village` are read through their own
 * repositories and then normalized to `LocationNode`, so every explorer
 * component works against one shape regardless of level. A real API can
 * replace these functions later without any component changing.
 */

function toTownshipNode(tspCode: string, tspName: string): LocationNode {
  return { code: tspCode, name: tspName, parentCode: null };
}

function toTownVillageNode(tvgCode: string, tvgName: string, tspCode: string): LocationNode {
  return { code: tvgCode, name: tvgName, parentCode: tspCode };
}

function toWardVillageNode(wvCode: string, wvName: string, tvgCode: string): LocationNode {
  return { code: wvCode, name: wvName, parentCode: tvgCode };
}

function findNode(
  nodes: readonly LocationNode[],
  code: string | null,
): LocationNode | null {
  if (!code) {
    return null;
  }

  return nodes.find((node) => node.code === code) ?? null;
}

/** Root level: every township in the district. */
export async function getTownshipNodes(): Promise<LocationNode[]> {
  const townships = await getTownships();

  return townships.map((township) => toTownshipNode(township.tspCode, township.tspName));
}

/** Every town / village tract in the district, unscoped. */
export async function getAllTownVillageNodes(): Promise<LocationNode[]> {
  const townVillages = await getTownVillages();

  return townVillages.map((townVillage) =>
    toTownVillageNode(townVillage.tvgCode, townVillage.tvgName, townVillage.tspCode),
  );
}

/** Every ward / village in the district, unscoped. */
export async function getAllWardVillageNodes(): Promise<LocationNode[]> {
  const wardVillages = await getWardVillages();

  return wardVillages.map((wardVillage) =>
    toWardVillageNode(wardVillage.wvCode, wardVillage.wvName, wardVillage.tvgCode),
  );
}


/** Everything the explorer renders for one resolved branch. */
export interface ExplorerChain {
  /** The requested selection, after deriving parents and dropping invalid codes. */
  selection: ExplorerSelection;
  townships: LocationNode[];
  /** Tracts inside the selected township, or every tract when none is selected. */
  townVillages: LocationNode[];
  /**
   * Villages inside the selected tract, or inside the selected township, or
   * every village when nothing is selected.
   */
  wardVillages: LocationNode[];
  township: LocationNode | null;
  townVillage: LocationNode | null;
  wardVillage: LocationNode | null;
}

/**
 * Resolve a requested selection against the data and scope the lists to it.
 *
 * The three columns always have something to show: with nothing selected they
 * list the whole district, and selecting a level narrows the levels below it.
 * A child implies its parent, so `?wv=194407` is enough on its own, and a code
 * whose parent does not line up is dropped rather than rendered.
 */
export async function getExplorerChain(requested: ExplorerSelection): Promise<ExplorerChain> {
  const [townships, allTownVillages, allWardVillages] = await Promise.all([
    getTownshipNodes(),
    getAllTownVillageNodes(),
    getAllWardVillageNodes(),
  ]);

  const requestedVillage = findNode(allWardVillages, requested.wardVillageCode);
  const tractOfRequestedVillage = requestedVillage
    ? findNode(allTownVillages, requestedVillage.parentCode)
    : null;

  // A child implies the parent it belongs to.
  const townVillage =
    findNode(allTownVillages, requested.townVillageCode) ?? tractOfRequestedVillage;

  const township =
    findNode(townships, requested.townshipCode) ??
    (townVillage?.parentCode ? findNode(townships, townVillage.parentCode) : null);

  // Keep a node only when the parent we ended up with is really its parent.
  const scopedTownVillage =
    townVillage && townVillage.parentCode === township?.code ? townVillage : null;

  const wardVillage =
    requestedVillage && requestedVillage.parentCode === scopedTownVillage?.code
      ? requestedVillage
      : null;

  const townVillages = township
    ? allTownVillages.filter((node) => node.parentCode === township.code)
    : allTownVillages;

  const tractCodesInScope = new Set(townVillages.map((node) => node.code));

  const wardVillages = allWardVillages.filter((node) => {
    if (scopedTownVillage) {
      return node.parentCode === scopedTownVillage.code;
    }
    if (township) {
      return tractCodesInScope.has(node.parentCode ?? "");
    }
    return true;
  });

  return {
    selection: {
      townshipCode: township?.code ?? null,
      townVillageCode: scopedTownVillage?.code ?? null,
      wardVillageCode: wardVillage?.code ?? null,
    },
    townships,
    townVillages,
    wardVillages,
    township,
    townVillage: scopedTownVillage,
    wardVillage,
  };
}

/**
 * A village together with the tract and township above it.
 *
 * The village code is the only input, so a village page can be opened directly
 * from a bookmark without carrying the parent codes in the URL.
 */
export interface WardVillageChain {
  village: LocationNode;
  tract: LocationNode;
  township: LocationNode;
}

/**
 * Walk up `ward_village` -> `town_vg` -> `township` for one village.
 *
 * Returns `null` when the village does not exist or when a parent row is
 * missing, which the route turns into a 404 rather than rendering a village
 * without a township.
 */
export async function getWardVillageChain(wvCode: string): Promise<WardVillageChain | null> {
  const wardVillage = await getWardVillageByCode(wvCode);
  if (!wardVillage) {
    return null;
  }

  const townVillage = await getTownVillageByCode(wardVillage.tvgCode);
  if (!townVillage) {
    return null;
  }

  const township = await getTownshipByCode(townVillage.tspCode);
  if (!township) {
    return null;
  }

  return {
    village: toWardVillageNode(wardVillage.wvCode, wardVillage.wvName, wardVillage.tvgCode),
    tract: toTownVillageNode(townVillage.tvgCode, townVillage.tvgName, townVillage.tspCode),
    township: toTownshipNode(township.tspCode, township.tspName),
  };
}
