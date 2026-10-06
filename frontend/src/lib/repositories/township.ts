import { apiFetch } from "@/lib/api-client";
import type { Township } from "@/types/census";

interface ApiTownship {
  tspCode: string;
  districtCode: string;
  tspName: string;
}

function fromApi(row: ApiTownship): Township {
  return { tspCode: row.tspCode, tspName: row.tspName };
}

/**
 * Data access for the `township` table.
 *
 * Every repository function is async so the JSON source can later be swapped
 * for an API call without touching any component.
 */
export async function getTownships(): Promise<Township[]> {
  const res = await apiFetch<{ data: ApiTownship[] }>("/locations/townships");
  return res.data.map(fromApi);
}

export async function getTownshipByCode(tspCode: string): Promise<Township | undefined> {
  const townships = await getTownships();
  return townships.find((township) => township.tspCode === tspCode);
}
