import type { WardVillage } from "@/types/census";

export interface ApiWardVillage {
  wvCode: string;
  tvgCode: string;
  wvName: string;
}

export function parseWardVillage(row: ApiWardVillage): WardVillage {
  return { wvCode: row.wvCode, wvName: row.wvName, tvgCode: row.tvgCode };
}
