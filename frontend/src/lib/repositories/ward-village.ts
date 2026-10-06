import { apiFetch } from "@/lib/api-client";
import type { WardVillage } from "@/types/census";

interface ApiWardVillage {
  wvCode: string;
  tvgCode: string;
  wvName: string;
}

function fromApi(row: ApiWardVillage): WardVillage {
  return { wvCode: row.wvCode, wvName: row.wvName, tvgCode: row.tvgCode };
}

/** Data access for the `ward_village` table. */
export async function getWardVillages(): Promise<WardVillage[]> {
  const res = await apiFetch<{ data: ApiWardVillage[] }>("/locations/wardvillages");
  return res.data.map(fromApi);
}

export async function getWardVillageByCode(wvCode: string): Promise<WardVillage | undefined> {
  const wardVillages = await getWardVillages();
  return wardVillages.find((wardVillage) => wardVillage.wvCode === wvCode);
}
