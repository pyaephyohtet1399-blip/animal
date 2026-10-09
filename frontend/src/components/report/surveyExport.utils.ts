import * as XLSX from "xlsx";
import { WDN_COLUMNS } from "@/config/wdn-columns";
import {
  AGE_SUFFIX,
  SEX_SUFFIX,
  getMainCategoryKeyMap,
} from "@/config/wdn-livestock-map";
import type { CensusDataset, CensusRecord } from "@/types/census-records";
import type { LivestockCensus } from "@/types/livestock";
import type { ReportScope } from "@/lib/reports";

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
    interviewerName: "",
    phone2: "",
  };

  Object.assign(flat, flattenLivestock(census));
  return flat;
}

// ─────────────────────────────────────────────
// 2. Flatten livestock counts
// ─────────────────────────────────────────────
function flattenLivestock(census: LivestockCensus | undefined): Record<string, number> {
  const result: Record<string, number> = {};

  for (const col of WDN_COLUMNS) {
    if (isAnimalColumn(col.key)) result[col.key] = 0;
  }
  if (!census) return result;

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
        result[flatKey] = (result[flatKey] ?? 0) + answer.count;
        continue;
      }

      const ageSuffix = answer.age ? AGE_SUFFIX[answer.age] : null;
      const sexSuffix = SEX_SUFFIX[answer.sex];
      if (!ageSuffix || !sexSuffix) continue;

      const flatKey = `${baseKey}${ageSuffix}${sexSuffix}`;
      result[flatKey] = (result[flatKey] ?? 0) + answer.count;
    }
  }
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
// 3. Scope filtering
// ─────────────────────────────────────────────
function extractScopeValues(scope: ReportScope | null) {
  if (!scope) return {};
  const s = scope as Record<string, unknown>;
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = s[k];
      if (typeof v === "string" && v.trim()) return v;
      if (v && typeof v === "object" && "code" in v) {
        const c = (v as { code?: unknown }).code;
        if (typeof c === "string") return c;
      }
    }
    return undefined;
  };
  return {
    district: pick("district", "districtCode"),
    township: pick("township", "townshipCode"),
    villageTract: pick("villageTract", "tract", "tractCode"),
    villageWard: pick("villageWard", "village", "villageCode"),
  };
}

function applyScope(
  records: CensusRecord[],
  scope: ReportScope | null,
): CensusRecord[] {
  const f = extractScopeValues(scope);
  if (!Object.values(f).some(Boolean)) return records;

  return records.filter((r) => {
    const flat = flattenRecord(r);
    if (f.district && flat.district !== f.district) return false;
    if (f.township && flat.township !== f.township) return false;
    if (f.villageTract && flat.villageTract !== f.villageTract) return false;
    if (f.villageWard && flat.villageWard !== f.villageWard) return false;
    return true;
  });
}

// ─────────────────────────────────────────────
// 4. Public API
// ─────────────────────────────────────────────
export function canExport(
  dataset: CensusDataset | null,
  scope: ReportScope | null,
): boolean {
  if (!dataset?.records?.length) return false;
  return applyScope(dataset.records, scope).length > 0;
}

export function exportToExcel(
  dataset: CensusDataset | null,
  scope: ReportScope | null,
): void {
  if (!dataset) throw new Error("Dataset is empty");
  const filtered = applyScope(dataset.records, scope);
  if (filtered.length === 0)
    throw new Error("No records match the current filters");

  const rows = filtered.map(flattenRecord);

  const headerKeys = WDN_COLUMNS.map((c) => c.key);
  const headerLabels = WDN_COLUMNS.map((c) => c.labelMm);

  const aoa: (string | number | null)[][] = [
    headerLabels,
    ...rows.map((row) =>
      headerKeys.map((k) => (row[k] as string | number | null) ?? ""),
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = WDN_COLUMNS.map((c) => ({ wch: c.width ?? 15 }));
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  if (ws["!ref"]) ws["!autofilter"] = { ref: ws["!ref"] };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "WDN Survey");

  const stamp = new Date().toISOString().slice(0, 10);
  const tag = buildScopeTag(scope);
  XLSX.writeFile(wb, `WDN_Survey_${tag}_${stamp}.xlsx`);
}

function buildScopeTag(scope: ReportScope | null): string {
  const f = extractScopeValues(scope);
  const parts = [f.district, f.township, f.villageTract, f.villageWard].filter(
    (v): v is string => Boolean(v),
  );
  return parts.length ? parts.join("-") : "All";
}