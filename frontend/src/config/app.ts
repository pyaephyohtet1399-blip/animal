/** Application level constants. Single source of truth for branding and scope. */

export const APP_NAME = "မွေးမြူရေးအင်းဆက်နှင့် တိရစ္ဆာန်စာရင်းကောက်ယူရေး စီမံခန့်ခွဲမှုစနစ်";
export const APP_SHORT_NAME = "မွေးမြူရေးစာရင်းကောက်ယူမှုစနစ်";

export const DISTRICT_NAME = "Meiktila District";
export const DISTRICT_NAME_MM = "မိတ္ထီလာခရိုင်";
export const COUNTRY_NAME = "မြန်မာနိုင်ငံ";

/** Phase 01 ships mock data only; no backend is connected yet. */
export const DATA_SOURCE_LABEL = "စမ်းသပ်အချက်အလက်များ (Mock data - JSON)";

/**
 * Delivery phase currently implemented. Surfaced in the sidebar footer so the
 * build state is visible without opening the README.
 */
export const CURRENT_PHASE = "အဆင့် ၀၉";
export const CURRENT_PHASE_LABEL = "ပြန်လည်အသုံးပြုနိုင်သော Component များ ပြင်ဆင်မွမ်းမံခြင်း";

/** Ordered geography chain, top to bottom. */
export const GEOGRAPHY_CHAIN = [
  "ခရိုင်",
  "မြို့နယ်",
  "မြို့ / ကျေးရွာအုပ်စု",
  "ရပ်ကွက် / ကျေးရွာ",
  "အိမ်ထောင်စု / လူတွေ့မေးမြန်းမှု",
  "မွေးမြူရေးစာရင်းကောက်ယူမှု",
] as const;