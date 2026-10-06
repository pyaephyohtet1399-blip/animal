import { apiFetch } from "@/lib/api-client";
import type { TownVillage } from "@/types/census";

interface ApiTownVillage {
  tvgCode: string;
  tspCode: string;
  tvgName: string;
}

function fromApi(row: ApiTownVillage): TownVillage {
  return { tvgCode: row.tvgCode, tvgName: row.tvgName, tspCode: row.tspCode };
}

/** Data access for the `town_vg` (Town / Village Tract) table. */
export async function getTownVillages(): Promise<TownVillage[]> {
  const res = await apiFetch<{ data: ApiTownVillage[] }>("/locations/townvgs");
  return res.data.map(fromApi);
}

export async function getTownVillageByCode(tvgCode: string): Promise<TownVillage | undefined> {
  const townVillages = await getTownVillages();
  return townVillages.find((townVillage) => townVillage.tvgCode === tvgCode);
}
