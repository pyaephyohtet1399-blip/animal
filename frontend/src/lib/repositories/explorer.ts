import type { ExplorerSelection, LocationNode } from "@/types/explorer";
import type { Township, TownVillage, WardVillage } from "@/types/census";

/**
 * Resolution of the geographic explorer.
 *
 * `township`, `town_vg` and `ward_village` are normalized to `LocationNode`,
 * so every explorer component works against one shape regardless of level.
 * These functions are pure — `censusApi` fetches the three lists through RTK
 * Query and passes them in, so navigating back to the explorer never refetches.
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

function townshipNodes(townships: readonly Township[]): LocationNode[] {
  return townships.map((row) => toTownshipNode(row.tspCode, row.tspName));
}

function townVillageNodes(townVillages: readonly TownVillage[]): LocationNode[] {
  return townVillages.map((row) => toTownVillageNode(row.tvgCode, row.tvgName, row.tspCode));
}

function wardVillageNodes(wardVillages: readonly WardVillage[]): LocationNode[] {
  return wardVillages.map((row) => toWardVillageNode(row.wvCode, row.wvName, row.tvgCode));
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
export function buildExplorerChain(
  requested: ExplorerSelection,
  townships: readonly Township[],
  allTownVillages: readonly TownVillage[],
  allWardVillages: readonly WardVillage[],
): ExplorerChain {
  const townshipNodesList = townshipNodes(townships);
  const allTownVillageNodes = townVillageNodes(allTownVillages);
  const allWardVillageNodes = wardVillageNodes(allWardVillages);

  const requestedVillage = findNode(allWardVillageNodes, requested.wardVillageCode);
  const tractOfRequestedVillage = requestedVillage
    ? findNode(allTownVillageNodes, requestedVillage.parentCode)
    : null;

  // A child implies the parent it belongs to.
  const townVillage =
    findNode(allTownVillageNodes, requested.townVillageCode) ?? tractOfRequestedVillage;

  const township =
    findNode(townshipNodesList, requested.townshipCode) ??
    (townVillage?.parentCode ? findNode(townshipNodesList, townVillage.parentCode) : null);

  // Keep a node only when the parent we ended up with is really its parent.
  const scopedTownVillage =
    townVillage && townVillage.parentCode === township?.code ? townVillage : null;

  const wardVillage =
    requestedVillage && requestedVillage.parentCode === scopedTownVillage?.code
      ? requestedVillage
      : null;

  const scopedTownVillages = township
    ? allTownVillageNodes.filter((node) => node.parentCode === township.code)
    : allTownVillageNodes;

  const tractCodesInScope = new Set(scopedTownVillages.map((node) => node.code));

  const scopedWardVillages = allWardVillageNodes.filter((node) => {
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
    townships: townshipNodesList,
    townVillages: scopedTownVillages,
    wardVillages: scopedWardVillages,
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
export function findWardVillageChain(
  wvCode: string,
  wardVillages: readonly WardVillage[],
  townVillages: readonly TownVillage[],
  townships: readonly Township[],
): WardVillageChain | null {
  const wardVillage = wardVillages.find((row) => row.wvCode === wvCode);
  if (!wardVillage) {
    return null;
  }

  const townVillage = townVillages.find((row) => row.tvgCode === wardVillage.tvgCode);
  if (!townVillage) {
    return null;
  }

  const township = townships.find((row) => row.tspCode === townVillage.tspCode);
  if (!township) {
    return null;
  }

  return {
    village: toWardVillageNode(wardVillage.wvCode, wardVillage.wvName, wardVillage.tvgCode),
    tract: toTownVillageNode(townVillage.tvgCode, townVillage.tvgName, townVillage.tspCode),
    township: toTownshipNode(township.tspCode, township.tspName),
  };
}
