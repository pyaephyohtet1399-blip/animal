/**
 * Maps (mainCategoryId + categoryName) → WDN_COLUMNS key.
 *
 * API categoryName (from console):
 *   - MC1: ဒေသနွား, အသားစားနွား, နို့စားနွား, နွားနောက်, ဒေသကျွဲ,
 *          နို့စားကျွဲ, မြင်း, အခြား
 *   - MC2: ဆိတ်, သိုး, ဝက်, ခွေး, အခြား
 *   - MC3: ဥစားကြက်, အသားစားကြက်, ဒေသကြက်, ဥစားဘဲ, အသားစားဘဲ,
 *          ဒေသဘဲ/ဓါတ်, ကြက်ဆင်, ဘဲငန်း, မန်ဒါလီ, ငုံး, အခြား
 *   - MC4: ဒေသနွား, ဒေသကျွဲ, နို့စားကျွဲ, ဝက်, ဆိတ်, သိုး
 */

// ─────────────────────────────────────────────
// BIG ANIMALS (MC1) — by categoryName
// ─────────────────────────────────────────────
const BIG_ANIMAL_KEY: Record<string, string> = {
  "ဒေသနွား": "localCattle",
  "အသားစားနွား": "beefCattle",
  "နို့စားနွား": "dairyCattle",
  "နွားနောက်": "buffalo",
  "ဒေသကျွဲ": "workingBuffalo",
  "နို့စားကျွဲ": "dairyBuffalo",
  "မြင်း": "horse",
  "အခြား": "otherLarge",
};

// ─────────────────────────────────────────────
// SMALL ANIMALS (MC2) — by categoryName
// ─────────────────────────────────────────────
const SMALL_ANIMAL_KEY: Record<string, string> = {
  "ဆိတ်": "goat",
  "သိုး": "sheep",
  "ဝက်": "pig",
  "ခွေး": "dog",
  "အခြား": "otherSmall2",
};

// ─────────────────────────────────────────────
// POULTRY (MC3) — by categoryName
// ─────────────────────────────────────────────
const POULTRY_KEY: Record<string, string> = {
  "ဥစားကြက်": "layerChicken",
  "အသားစားကြက်": "broilerChicken",
  "ဒေသကြက်": "localChicken",
  "ဥစားဘဲ": "layerDuck",
  "အသားစားဘဲ": "meatDuck",
  "ဒေသဘဲ/ဓါတ်": "localDuck",
  "ကြက်ဆင်": "turkey",
  "ဘဲငန်း": "goose",
  "မန်ဒါလီ": "mandarin",
  "ငုံး": "quail",
  "အခြား": "otherPoultry3",
};

// ─────────────────────────────────────────────
// BREEDING (MC4) — by categoryName
// ─────────────────────────────────────────────
const BREEDING_KEY: Record<string, string> = {
  "ဒေသနွား": "breedingLocalCattle",
  "ဒေသကျွဲ": "breedingLocalBuffalo",
  "နို့စားကျွဲ": "breedingDairyBuffalo",
  "ဝက်": "breedingPig",
  "ဆိတ်": "breedingGoat",
  "သိုး": "breedingSheep",
};

/**
 * Get the name→key map for a given main category.
 */
export function getMainCategoryKeyMap(
  mainCategoryId: string,
): Record<string, string> {
  switch (mainCategoryId) {
    case "MC1":
      return BIG_ANIMAL_KEY;
    case "MC2":
      return SMALL_ANIMAL_KEY;
    case "MC3":
      return POULTRY_KEY;
    case "MC4":
      return BREEDING_KEY;
    default:
      return {};
  }
}

// ─────────────────────────────────────────────
// AGE → WDN column suffix
// ─────────────────────────────────────────────
export const AGE_SUFFIX: Record<string, string> = {
  LY1: "Under1",
  Y1B3: "1to3",
  GY3: "Over3",
  OY1: "Over1",
  LM2: "Under2m",
  M2B6: "2to6m",
  GM6: "Over6m",
  SMALL: "Small",
  MEDIUM: "Medium",
  LARGE: "Large",
};

// ─────────────────────────────────────────────
// SEX → WDN column suffix
// ─────────────────────────────────────────────
export const SEX_SUFFIX: Record<string, string> = {
  M: "Male",
  MS: "CastratedMale",
  F: "Female",
};