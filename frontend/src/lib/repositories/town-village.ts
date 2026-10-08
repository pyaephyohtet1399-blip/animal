import type { TownVillage } from "@/types/census";

export interface ApiTownVillage {
  tvgCode: string;
  tspCode: string;
  tvgName: string;
}

export function parseTownVillage(row: ApiTownVillage): TownVillage {
  return { tvgCode: row.tvgCode, tvgName: row.tvgName, tspCode: row.tspCode };
}
