import { apiFetch } from "@/lib/api-client";
import type { Category, MainCategory } from "@/types/census";

interface ApiCategory {
  categoryId: number;
  name: string;
}

const TYPE_ORDER = ["big", "small", "poultry", "breeding"] as const;

const TYPE_TO_MCAT: Record<(typeof TYPE_ORDER)[number], string> = {
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

/** Data access for the `main_category` and `category` tables. */
export async function getMainCategories(): Promise<MainCategory[]> {
  return MAIN_CATEGORIES;
}

export async function getCategories(): Promise<Category[]> {
  const results = await Promise.all(
    TYPE_ORDER.map((type) => apiFetch<{ data: ApiCategory[] }>(`/categories/${type}`)),
  );

  const categories: Category[] = [];
  let globalIndex = 1;

  results.forEach((res, i) => {
    const type = TYPE_ORDER[i];
    if (!type) return;
    const mcat_id = TYPE_TO_MCAT[type];
    res.data.forEach((item) => {
      categories.push({ cat_id: `C${globalIndex++}`, cat_name: item.name, mcat_id });
    });
  });

  return categories;
}
