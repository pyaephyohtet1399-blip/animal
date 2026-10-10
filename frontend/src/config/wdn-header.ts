/**
 * Three-row WDN Excel header.
 *
 * The flat 246-column labels repeat the animal name on every column
 * (e.g. "(၁)နှစ်အောက် အထီး _ဒေသနွား"), which reads as duplicated
 * columns. This builds a grouped header instead:
 *
 *   row 1  "ဒေသနွား"              merged across the animal's 11 columns
 *   row 2  "တစ်နှစ်အောက်"        merged across its 3 sex columns
 *   row 3  "အထီး" / "သင်းကွပ် အထီး" / "အမ"
 *
 * Cells are derived from the English column keys, so they stay in sync
 * with `WDN_COLUMNS` without hand-maintaining a second 246-row table.
 */

import { WDN_COLUMNS } from "@/config/wdn-columns";

export interface WdnMergeCell {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

export interface WdnHeader {
  /** [row1, row2, row3] — each246 entries wide. */
  rows: [string[], string[], string[]];
  merges: WdnMergeCell[];
}

const HOUSEHOLD_GROUP = "အိမ်ထောင်စု အချက်အလက်";
const INTERVIEWER_GROUP = "မေးမြန်းသူ";
const BREEDING_GROUP = "မျိုးတိရစ္ဆာန်";

/** Column-key prefix → row-1 animal group. */
const BASE_GROUP: Record<string, string> = {
  localCattle: "ဒေသနွား",
  beefCattle: "အသားစားနွား",
  dairyCattle: "နို့စားနွား",
  buffalo: "နွားနောက်",
  workingBuffalo: "ခိုင်းကျွဲ",
  dairyBuffalo: "နို့စားကျွဲ",
  horse: "မြင်း",
  otherLarge: "အခြား",
  goat: "ဆိတ်",
  sheep: "သိုး",
  pig: "ဝက်",
  dog: "ခွေး",
  otherSmall2: "အခြား",
  layerChicken: "ဉစားကြက်",
  broilerChicken: "အသားစားကြက်",
  localChicken: "ဒေသကြက်",
  layerDuck: "ဉစားဘဲ",
  meatDuck: "အသားစားဘဲ",
  localDuck: "ဒေသဘဲ",
  turkey: "ကြက်ဆင်",
  goose: "ဘဲငန်း",
  mandarin: "မန်ဒါလီ",
  quail: "ငုံး",
  otherPoultry3: "အခြား",
};

/** Age/size suffix → row-2 label. */
const AGE_GROUP: Record<string, string> = {
  Under1: "တစ်နှစ်အောက်",
  "1to3": "တစ်နှစ်မှ (၃)နှစ်",
  Over3: "(၃)နှစ်အထက်",
  Under2m: "(၂)လအောက်",
  "2to6m": "(၂)လမှ (၆)လ",
  Over6m: "(၆)လအထက်",
  Small: "ငယ်",
  Medium: "လတ်",
  Large: "ကြီး",
  SmallMedium: "ငယ်+လတ်",
  Immature: "မတမ်း",
};

/** Sex suffix → row-3 leaf. */
const SEX_LEAF: Record<string, string> = {
  Male: "အထီး",
  CastratedMale: "သင်းကွပ် အထီး",
  Female: "အမ",
};

/** Breeding key animal part → row-2 animal name. */
const BREEDING_ANIMAL: Record<string, string> = {
  LocalCattle: "ဒေသနွား",
  LocalBuffalo: "ဒေသကျွဲ",
  DairyBuffalo: "နို့စားကျွဲ",
  Pig: "ဝက်",
  Goat: "ဆိတ်",
  Sheep: "သိုး",
};

const BASE_KEYS = Object.keys(BASE_GROUP);

/** Excel forbids these in sheet names, and `".1"` suffixes are artifacts. */
function stripDot(label: string): string {
  return label.replace(/\.\d+$/, "");
}

function baseGroup(key: string): string | null {
  for (const base of BASE_KEYS) {
    if (key.startsWith(base)) return BASE_GROUP[base] ?? null;
  }
  return null;
}

/**
 * Last-resort row-2 text when the age suffix has no mapping (e.g. duck
 * "Layer" columns): use the label without its `_group` suffix and sex token.
 */
function leafFromLabel(label: string): string {
  const withoutGroup = label.split("_")[0] ?? label;
  const withoutSex = withoutGroup.replace(/\(\s*(?:အထီး|အမ)\s*\)/g, "");
  const trimmed = stripDot(withoutSex.trim());
  return trimmed || stripDot(label);
}

function headerCells(key: string, labelMm: string): [string, string, string] {
  if (key === "interviewerName") return [INTERVIEWER_GROUP, "အမည်", ""];
  if (key === "phone2") return [INTERVIEWER_GROUP, "ဖုန်းနံပါတ်", ""];

  if (
    [
      "district", "township", "villageTract", "villageWard", "householdNo",
      "interviewDate", "respondentName", "gender", "age", "education", "phone",
      "householdHeadName", "gender1", "age1", "education1", "phone1",
    ].includes(key)
  ) {
    return [HOUSEHOLD_GROUP, stripDot(labelMm), ""];
  }

  if (key.startsWith("breeding")) {
    const rest = key.slice("breeding".length);
    const sexKey = rest.endsWith("Female")
      ? "Female"
      : rest.endsWith("Male")
        ? "Male"
        : null;
    const animalPart = sexKey ? rest.slice(0, -sexKey.length) : rest;
    const animal = BREEDING_ANIMAL[animalPart];
    if (animal && sexKey) return [BREEDING_GROUP, animal, SEX_LEAF[sexKey] ?? ""];
    return [BREEDING_GROUP, leafFromLabel(stripDot(labelMm)), ""];
  }

  const group = baseGroup(key);
  if (!group) return ["", stripDot(labelMm), ""];

  if (key.endsWith("Breed")) return [group, "မျိုး", ""];
  if (key.endsWith("Total")) return [group, "စုစုပေါင်း", ""];

  let sexKey: string | null = null;
  let agePart: string | null = null;
  if (key.endsWith("CastratedMale")) {
    sexKey = "CastratedMale";
    agePart = key.slice(0, -"CastratedMale".length);
  } else if (key.endsWith("Male")) {
    sexKey = "Male";
    agePart = key.slice(0, -"Male".length);
  } else if (key.endsWith("Female")) {
    sexKey = "Female";
    agePart = key.slice(0, -"Female".length);
  }

  if (sexKey && agePart) {
    const base = BASE_KEYS.find((b) => agePart.startsWith(b));
    const ageKey = base ? agePart.slice(base.length).replace(/^_/, "") : agePart;
    const age = AGE_GROUP[ageKey];
    if (age) return [group, age, SEX_LEAF[sexKey] ?? ""];
    return [group, leafFromLabel(stripDot(labelMm)), SEX_LEAF[sexKey] ?? ""];
  }

  return [group, stripDot(labelMm), ""];
}

function computeMerges(row1: string[], row2: string[]): WdnMergeCell[] {
  const merges: WdnMergeCell[] = [];

  let i = 0;
  while (i < row1.length) {
    let j = i;
    while (j + 1 < row1.length && row1[j + 1] === row1[i]) j += 1;
    if (j > i) merges.push({ s: { r: 0, c: i }, e: { r: 0, c: j } });
    i = j + 1;
  }

  i = 0;
  while (i < row2.length) {
    if (!row2[i]) {
      i += 1;
      continue;
    }
    let j = i;
    while (
      j + 1 < row2.length &&
      row2[j + 1] === row2[i] &&
      row1[j + 1] === row1[i]
    ) {
      j += 1;
    }
    if (j > i) merges.push({ s: { r: 1, c: i }, e: { r: 1, c: j } });
    i = j + 1;
  }

  return merges;
}

let cached: WdnHeader | null = null;

/** Build (and cache) the three header rows plus merge ranges. */
export function buildWdnHeader(): WdnHeader {
  if (cached) return cached;

  const row1: string[] = [];
  const row2: string[] = [];
  const row3: string[] = [];

  WDN_COLUMNS.forEach((col) => {
    const [group, sub, leaf] = headerCells(col.key, col.labelMm);
    row1.push(group);
    row2.push(sub);
    row3.push(leaf);
  });

  cached = { rows: [row1, row2, row3], merges: computeMerges(row1, row2) };
  return cached;
}
