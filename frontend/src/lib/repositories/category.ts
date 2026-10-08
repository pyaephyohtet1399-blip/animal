import type { Category, MainCategory } from "@/types/census";

export interface ApiCategory {
  categoryId: number;
  name: string;
}

export const CATEGORY_TYPES = ["big", "small", "poultry", "breeding"] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number];

const TYPE_TO_MCAT: Record<CategoryType, string> = {
  big: "MC1",
  small: "MC2",
  poultry: "MC3",
  breeding: "MC4",
};

const MAIN_CATEGORIES: MainCategory[] = [
  { mcat_id: "MC1", name: "တိရစ္ဆာန်ကြီး" },
  { mcat_id: "MC2", name: "တိရစ္ဆာန်ငယ်" },
  { mcat_id: "MC3", name: "ကြက် / ဘဲ / ငုံး" },
  { mcat_id: "MC4", name: "မျိုးတိရစ္ဆာန်" },
];

/** Static main-category list (`main_category` rows are fixed in the app). */
export function getMainCategories(): MainCategory[] {
  return MAIN_CATEGORIES;
}

/**
 * Merge the four `/categories/:type` responses into one id-ordered list.
 *
 * The backend numbers animals within each type, so a global `cat_id` is
 * assigned here in type order — the same order the mobile app records.
 * `results` must be aligned with `CATEGORY_TYPES`.
 */
export function buildCategories(results: Array<{ data: ApiCategory[] }>): Category[] {
  const categories: Category[] = [];
  let globalIndex = 1;

  results.forEach((res, i) => {
    const type = CATEGORY_TYPES[i];
    if (!type) return;
    const mcat_id = TYPE_TO_MCAT[type];
    res.data.forEach((item) => {
      categories.push({ cat_id: `C${globalIndex++}`, cat_name: item.name, mcat_id });
    });
  });

  return categories;
}
