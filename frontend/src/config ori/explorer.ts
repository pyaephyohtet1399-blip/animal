import type { ExplorerLevel } from "@/types/explorer";

export interface ExplorerLevelCopy {
  /** Column heading. */
  title: string;
  /** Local-language heading, shown under the English one. */
  titleMm: string;
  /** Accessible name for the column's search field. */
  searchLabel: string;
  searchPlaceholder: string;
  /** Shown when the level has no records at all. */
  emptyTitle: string;
  /** Shown when records exist but the search text matches none of them. */
  noResultTitle: string;
}

/**
 * Per-level wording for the explorer. Kept in `config` so the components stay
 * presentational and the copy can be reviewed in one place.
 */
export const EXPLORER_LEVEL_COPY = {
  township: {
    title: "Townships",
    titleMm: "မြို့နယ်",
    searchLabel: "မြို့နယ်များကို ရှာဖွေရန်",
    searchPlaceholder: "အမည် သို့မဟုတ် ကုဒ်",
    emptyTitle: "ရရှိနိုင်သော မြို့နယ်များ မရှိသေးပါ",
    noResultTitle: "ဤရှာဖွေမှုနှင့် ကိုက်ညီသော မြို့နယ် မရှိပါ",
  },
  townVillage: {
    title: "Town / Village Tracts",
    titleMm: "မြို့ / ကျေးရွာအုပ်စု",
    searchLabel: "မြို့ သို့မဟုတ် ကျေးရွာအုပ်စုများကို ရှာဖွေရန်",
    searchPlaceholder: "အမည် သို့မဟုတ် ကုဒ်",
    emptyTitle: "မြို့ သို့မဟုတ် ကျေးရွာအုပ်စုများ မရှိသေးပါ",
    noResultTitle: "ဤရှာဖွေမှုနှင့် ကိုက်ညီသော ကျေးရွာအုပ်စု မရှိပါ",
  },
  wardVillage: {
    title: "Wards / Villages",
    titleMm: "ရပ်ကွက် / ကျေးရွာ",
    searchLabel: "ရပ်ကွက် သို့မဟုတ် ကျေးရွာများကို ရှာဖွေရန်",
    searchPlaceholder: "အမည် သို့မဟုတ် ကုဒ်",
    emptyTitle: "ရပ်ကွက် သို့မဟုတ် ကျေးရွာများ မရှိသေးပါ",
    noResultTitle: "ဤရှာဖွေမှုနှင့် ကိုက်ညီသော ရပ်ကွက် သို့မဟုတ် ကျေးရွာ မရှိပါ",
  },
} satisfies Record<ExplorerLevel, ExplorerLevelCopy>;

export const EXPLORER_COPY = {
  /** Shown in the scope bar while nothing is selected. */
  scopeAll: "ခရိုင်တစ်ခုလုံးကို ပြသနေသည်",
  scopeTownship: "မြို့နယ်တစ်ခုကို ပြသနေသည်",
  scopeTownVillage: "မြို့ / ကျေးရွာအုပ်စုတစ်ခုကို ပြသနေသည်",
  scopeWardVillage: "ရပ်ကွက် / ကျေးရွာတစ်ခုကို ပြသနေသည်",
  /** Label for the level the lists are currently scoped to. */
  scopeValue: "နယ်ပယ်အသီးသီး (Scope)",
  backOneLevel: "တစ်ဆင့်နောက်သို့ ပြန်သွားရန်",
  showAll: "အားလုံးပြရန်",
  backOneLevelHint: "အနက်ရှိုင်းဆုံး ရွေးချယ်ထားသည့် အဆင့်ကို ဖယ်ရှားသည်",
  showAllHint: "ရွေးချယ်မှုကို ရှင်းလင်းပြီး ခရိုင်တစ်ခုလုံးကို စာရင်းပြုစုသည်",
  /** Describes the village link that sits on each village row. */
  openVillageDetail: "ကျေးရွာ အသေးစိတ်ကို ဖွင့်ရန်",
} as const;