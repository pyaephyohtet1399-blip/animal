import { apiFetch } from "@/lib/api-client";
import { getCategories, getMainCategories } from "@/lib/repositories/category";
import type { Category, MainCategory } from "@/types/census";
import type { LivestockAnswer, LivestockCensus, LivestockGroup } from "@/types/livestock";

/**
 * Data access for the livestock census.
 *
 * The backend stores animals in four typed arrays on each survey. This layer
 * resolves every reference (category, main category, age class, sex) so the
 * components never see raw API field names.
 */

interface ApiAnimal {
  categoryId: number;
  ageLimit?: string;
  sex: string;
  count: number;
}

interface ApiSurveyDetail {
  surveyId: number;
  bigAnimals: ApiAnimal[];
  smallAnimals: ApiAnimal[];
  poultry: ApiAnimal[];
  breedingAnimals: ApiAnimal[];
}

type AnimalType = "big" | "small" | "poultry" | "breeding";

const TYPE_TO_MCAT: Record<AnimalType, string> = {
  big: "MC1",
  small: "MC2",
  poultry: "MC3",
  breeding: "MC4",
};

const TYPE_OFFSET: Record<AnimalType, number> = { big: 0, small: 8, poultry: 13, breeding: 24 };

const AGE_MAP: Record<string, string> = {
  LessThanOne: "LY1",
  Between1and3: "Y1B3",
  Over3: "GY3",
  Under2months: "LM2",
  Between2and6months: "M2B6",
  Over6months: "GM6",
  Young: "SMALL",
  Middle: "MEDIUM",
  Old: "LARGE",
};

const SEX_MAP: Record<string, "M" | "MS" | "F"> = {
  male: "M",
  female: "F",
  ca_male: "MS",
  ca_female: "F",
};

function catIdFor(type: AnimalType, categoryId: number): string {
  return `C${TYPE_OFFSET[type] + categoryId}`;
}

function getArrays(detail: ApiSurveyDetail): Array<{ type: AnimalType; animals: ApiAnimal[] }> {
  return [
    { type: "big", animals: detail.bigAnimals ?? [] },
    { type: "small", animals: detail.smallAnimals ?? [] },
    { type: "poultry", animals: detail.poultry ?? [] },
    { type: "breeding", animals: detail.breedingAnimals ?? [] },
  ];
}

function buildCensus(
  detail: ApiSurveyDetail,
  categories: Category[],
  mainCategories: MainCategory[],
): LivestockCensus {
  const categoryById = new Map(categories.map((c) => [c.cat_id, c]));
  const mainCategoryById = new Map(mainCategories.map((m) => [m.mcat_id, m]));

  const allAnswers: LivestockAnswer[] = [];
  let answerId = 1;

  for (const { type, animals } of getArrays(detail)) {
    for (const animal of animals) {
      const cat_id = catIdFor(type, animal.categoryId);
      const category = categoryById.get(cat_id);
      const mcat_id = TYPE_TO_MCAT[type];
      const mainCategory = mainCategoryById.get(mcat_id);
      const age = animal.ageLimit ? (AGE_MAP[animal.ageLimit] ?? null) : null;
      const sex = SEX_MAP[animal.sex] ?? "M";

      if (!category || !mainCategory) continue;

      allAnswers.push({
        id: answerId++,
        count: animal.count,
        categoryId: category.cat_id,
        categoryName: category.cat_name,
        mainCategoryId: mainCategory.mcat_id,
        mainCategoryName: mainCategory.name,
        restrictionId: 0,
        age: age as LivestockAnswer["age"],
        sex,
      });
    }
  }

  const totalCount = allAnswers.reduce((sum, a) => sum + a.count, 0);

  const groupsById = new Map<string, LivestockGroup>();
  for (const mc of mainCategories) {
    groupsById.set(mc.mcat_id, {
      mainCategoryId: mc.mcat_id,
      mainCategoryName: mc.name,
      answers: [],
    });
  }
  for (const answer of allAnswers) {
    groupsById.get(answer.mainCategoryId)?.answers.push(answer);
  }
  const groups = [...groupsById.values()].filter((g) => g.answers.length > 0);

  return { groups, totalCount, answerCount: allAnswers.length, unresolvedCount: 0 };
}

/**
 * Livestock census for several interviews at once, keyed by `p_Id`.
 *
 * Each survey detail is fetched individually; the taxonomy is read once.
 */
export async function getLivestockCensusForInterviews(
  p_Ids: readonly number[],
): Promise<Record<string, LivestockCensus>> {
  const censusById: Record<string, LivestockCensus> = {};

  if (p_Ids.length === 0) {
    return censusById;
  }

  const [categories, mainCategories] = await Promise.all([getCategories(), getMainCategories()]);

  const details = await Promise.all(
    p_Ids.map((id) =>
      apiFetch<{ data: ApiSurveyDetail }>(`/surveys/${id}`).then((r) => r.data),
    ),
  );

  details.forEach((detail, i) => {
    censusById[String(p_Ids[i])] = buildCensus(detail, categories, mainCategories);
  });

  return censusById;
}
