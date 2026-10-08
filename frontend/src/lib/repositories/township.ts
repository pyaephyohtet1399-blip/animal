import type { Township } from "@/types/census";

export interface ApiTownship {
  tspCode: string;
  districtCode: string;
  tspName: string;
}

export function parseTownship(row: ApiTownship): Township {
  return { tspCode: row.tspCode, tspName: row.tspName };
}
