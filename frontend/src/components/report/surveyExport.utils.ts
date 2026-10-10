import * as XLSX from "xlsx";
import { WDN_COLUMNS } from "@/config/wdn-columns";
import { buildWdnHeader } from "@/config/wdn-header";
import {
  AGE_SUFFIX,
  SEX_SUFFIX,
  getMainCategoryKeyMap,
} from "@/config/wdn-livestock-map";
import type { CensusDataset, CensusRecord } from "@/types/census-records";
import type { LivestockCensus } from "@/types/livestock";

const WDN_KEYS = new Set(WDN_COLUMNS.map((c) => c.key));

// ─────────────────────────────────────────────
// 1. Flatten one CensusRecord → flat object
// ─────────────────────────────────────────────
function flattenRecord(record: CensusRecord): Record<string, unknown> {
  const { interview, township, tract, village, census } = record;

  const flat: Record<string, unknown> = {
    district: "",
    township: township?.name ?? "",
    villageTract: tract?.name ?? "",
    villageWard: village?.name ?? "",
    householdNo: interview?.p_Id ?? "",
    interviewDate: interview?.ans_date ?? "",
    respondentName: interview?.h_name ?? "",
    gender: interview?.h_gender ?? "",
    age: interview?.h_age ?? "",
    education: interview?.h_edu ?? "",
    phone: interview?.h_phone ?? "",
    householdHeadName: interview?.h_name ?? "",
    gender1: interview?.h_gender ?? "",
    age1: interview?.h_age ?? "",
    education1: interview?.h_edu ?? "",
    phone1: interview?.h_phone ?? "",
    interviewerName: interview?.interviewer_name ?? "",
    phone2: interview?.interviewer_phone ?? "",
  };

  Object.assign(flat, flattenLivestock(census));
  return flat;
}

// ─────────────────────────────────────────────
// 2. Flatten livestock counts
// ─────────────────────────────────────────────
function flattenLivestock(census: LivestockCensus | undefined): Record<string, number> {
  const result: Record<string, number> = {};
  const totals: Record<string, number> = {};

  for (const col of WDN_COLUMNS) {
    if (isAnimalColumn(col.key)) result[col.key] = 0;
  }
  if (!census) return result;

  const add = (baseKey: string, flatKey: string, count: number) => {
    result[flatKey] = (result[flatKey] ?? 0) + count;
    const totalKey = `${baseKey}Total`;
    if (WDN_KEYS.has(totalKey)) totals[totalKey] = (totals[totalKey] ?? 0) + count;
  };

  for (const group of census.groups) {
    const keyMap = getMainCategoryKeyMap(group.mainCategoryId);
    if (Object.keys(keyMap).length === 0) continue;

    for (const answer of group.answers) {
      const baseKey = keyMap[answer.categoryName];   // ← by NAME
      if (!baseKey) {
        console.warn(`[WDN] Unmapped: ${answer.categoryName}`);
        continue;
      }

      if (group.mainCategoryId === "MC4") {
        const sexSuffix = SEX_SUFFIX[answer.sex];
        if (!sexSuffix) continue;
        const flatKey = `${baseKey}${sexSuffix}`;
        add(baseKey, flatKey, answer.count);
        continue;
      }

      const ageSuffix = answer.age ? AGE_SUFFIX[answer.age] : null;
      const sexSuffix = SEX_SUFFIX[answer.sex];
      if (!ageSuffix || !sexSuffix) continue;

      const flatKey = `${baseKey}${ageSuffix}${sexSuffix}`;
      add(baseKey, flatKey, answer.count);
    }
  }

  Object.assign(result, totals);
  return result;
}

function isAnimalColumn(key: string): boolean {
  return (
    key.startsWith("local") ||
    key.startsWith("beef") ||
    key.startsWith("dairy") ||
    key.startsWith("buffalo") ||
    key.startsWith("working") ||
    key.startsWith("horse") ||
    key.startsWith("other") ||
    key.startsWith("goat") ||
    key.startsWith("sheep") ||
    key.startsWith("pig") ||
    key.startsWith("dog") ||
    key.startsWith("layer") ||
    key.startsWith("broiler") ||
    key.startsWith("meat") ||
    key.startsWith("turkey") ||
    key.startsWith("goose") ||
    key.startsWith("mandarin") ||
    key.startsWith("quail") ||
    key.startsWith("breeding")
  );
}

// ─────────────────────────────────────────────
// 3. Workbook building
// ─────────────────────────────────────────────
function buildSheetAoa(records: CensusRecord[]): (string | number | null)[][] {
  const header = buildWdnHeader();
  const headerKeys = WDN_COLUMNS.map((c) => c.key);
  return [
    header.rows[0],
    header.rows[1],
    header.rows[2],
    ...records.map((record) => {
      const row = flattenRecord(record);
      return headerKeys.map((k) => (row[k] as string | number | null) ?? "");
    }),
  ];
}

function appendSheet(
  wb: XLSX.WorkBook,
  sheetName: string,
  records: CensusRecord[],
): void {
  const header = buildWdnHeader();
  const aoa = buildSheetAoa(records);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = WDN_COLUMNS.map((c) => ({ wch: c.width ?? 15 }));
  ws["!freeze"] = { xSplit: 0, ySplit: 3 };
  ws["!merges"] = header.merges;
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 2, c: 0 },
      e: { r: aoa.length - 1, c: WDN_COLUMNS.length - 1 },
    }),
  };
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

// ─────────────────────────────────────────────
// 4. Public API
// ─────────────────────────────────────────────
export function canExport(dataset: CensusDataset | null): boolean {
  return Boolean(dataset?.records?.length);
}

/**
 * Exports every record the officer can see in one sheet (report filters are
 * ignored on purpose — the user filters inside Excel via the autofilter).
 */
export function exportToExcel(dataset: CensusDataset | null): void {
  if (!dataset?.records?.length) throw new Error("Dataset is empty");

  const wb = XLSX.utils.book_new();
  appendSheet(wb, "WDN Survey", dataset.records);

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `WDN_Survey_All_${stamp}.xlsx`);
}