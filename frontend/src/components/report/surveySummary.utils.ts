/**
 * WDN Column Mapping for Survey Summary Report.
 * Re-exports the complete 246-column specification from wdn-columns.ts
 * and provides section organization for the report summary UI.
 */

import { WDN_COLUMNS } from "@/config/wdn-columns";
import type { WdnColumnDef } from "@/config/wdn-columns";

/** Section labels for the UI - displayed in the report summary sidebar. */
export const SECTION_LABELS = [
  "Survey / Household Information",
  "Cattle (Local)",
  "Cattle (Beef)",
  "Cattle (Dairy)",
  "Buffalo (Working)",
  "Buffalo (Dairy)",
  "Horse",
  "Other Large Animals",
  "Goat",
  "Sheep",
  "Pig",
  "Dog",
  "Other Small Animals",
  "Chicken (Layer)",
  "Chicken (Broiler)",
  "Chicken (Local)",
  "Duck (Layer)",
  "Duck (Meat)",
  "Duck (Local)",
  "Turkey",
  "Goose",
  "Mandarin Duck",
  "Quail",
  "Other Poultry",
  "Breeding Animals",
  "Interviewer Information",
];

/** Section A: Survey / Household Information (columns 1-16) */
export const HOUSEHOLD_COLUMNS: string[] = WDN_COLUMNS
  .slice(0, 16)
  .map((c: WdnColumnDef) => c.labelMm);

/** Get all column names from the WDN specification. */
export function getAllColumnNames(): string[] {
  return WDN_COLUMNS.map((c: WdnColumnDef) => c.labelMm);
}

/** Count total columns across all sections. */
export function getTotalColumnCount(): number {
  return WDN_COLUMNS.length;
}

/** Validate that a column name exists in the WDN specification. */
export function findColumnSection(columnName: string): string | null {
  const idx = WDN_COLUMNS.findIndex((c: WdnColumnDef) => c.labelMm === columnName);
  if (idx < 0) return null;
  // Map index to section
  if (idx < 16) return "household";
  if (idx < 27) return "cattle-local";
  if (idx < 38) return "cattle-beef";
  if (idx < 49) return "cattle-dairy";
  if (idx < 60) return "buffalo-working";
  if (idx < 71) return "buffalo-dairy";
  if (idx < 82) return "horse";
  if (idx < 93) return "other-large";
  if (idx < 104) return "goat";
  if (idx < 115) return "sheep";
  if (idx < 126) return "pig";
  if (idx < 137) return "dog";
  if (idx < 148) return "other-small";
  if (idx < 159) return "chicken-layer";
  if (idx < 167) return "chicken-broiler";
  if (idx < 174) return "chicken-local";
  if (idx < 182) return "duck-layer";
  if (idx < 184) return "duck-meat";
  if (idx < 192) return "duck-local";
  if (idx < 200) return "turkey";
  if (idx < 208) return "goose";
  if (idx < 216) return "mandarin";
  if (idx < 224) return "quail";
  if (idx < 232) return "other-poultry";
  if (idx < 244) return "breeding";
  return "interviewer";
}

/** Get columns for a specific section. */
export function getSectionColumns(section: string): string[] {
  const ranges: Record<string, [number, number]> = {
    household: [0, 16],
    "cattle-local": [16, 27],
    "cattle-beef": [27, 38],
    "cattle-dairy": [38, 49],
    "buffalo-working": [49, 60],
    "buffalo-dairy": [60, 71],
    horse: [71, 82],
    "other-large": [82, 93],
    goat: [93, 104],
    sheep: [104, 115],
    pig: [115, 126],
    dog: [126, 137],
    "other-small": [137, 148],
    "chicken-layer": [148, 159],
    "chicken-broiler": [159, 167],
    "chicken-local": [167, 174],
    "duck-layer": [174, 182],
    "duck-meat": [182, 184],
    "duck-local": [184, 192],
    turkey: [192, 200],
    goose: [200, 208],
    mandarin: [208, 216],
    quail: [216, 224],
    "other-poultry": [224, 232],
    breeding: [232, 244],
    interviewer: [244, 246],
  };

  const range = ranges[section];
  if (!range) return [];
  return WDN_COLUMNS.slice(range[0], range[1]).map((c: WdnColumnDef) => c.labelMm);
}