import { buildAnswerAggregates } from "@/lib/reports";
import { getMainCategories } from "@/lib/repositories/category";
import { buildOverviewAnswers, type CensusOverview } from "@/lib/repositories/livestock";
import type { Category, Township, TownVillage, WardVillage } from "@/types/census";
import type { CensusTotals, CategoryStat } from "@/types/statistics";
import type {
  LargeLivestockReportRow,
  PoultryLivestockReportRow,
  SmallLivestockReportRow,
  LivestockSexSummaryRow,
} from "@/lib/reports";

/**
 * District-wide statistics for the dashboard.
 *
 * The dashboard reads the server-side overview (`GET /statistics/overview`),
 * which pre-groups every animal row in one aggregation instead of the browser
 * downloading every survey. Category/age/sex resolution reuses the same
 * mapping and accumulation as the reports, so both screens agree.
 */

export interface DashboardOverview {
  totals: CensusTotals;
  categories: CategoryStat[];
  mc1Large: LargeLivestockReportRow[];
  mc2Small: SmallLivestockReportRow[];
  mc3Poultry: PoultryLivestockReportRow[];
  mc4Summary: LivestockSexSummaryRow[];
}

export function buildDashboardOverview(
  overview: CensusOverview,
  categories: Category[],
  townships: Township[],
  townVillages: TownVillage[],
  wardVillages: WardVillage[],
): DashboardOverview {
  const mainCategories = getMainCategories();
  const answers = buildOverviewAnswers(overview.rows, categories, mainCategories);

  const groupOrder = new Map(mainCategories.map((mainCategory, index) => [mainCategory.mcat_id, index]));
  const categoryOrder = new Map(categories.map((category, index) => [category.cat_id, index]));
  const grids = buildAnswerAggregates(answers, groupOrder, categoryOrder);

  const totals: CensusTotals = {
    townshipCount: townships.length,
    townVillageCount: townVillages.length,
    wardVillageCount: wardVillages.length,
    interviewCount: overview.interviewCount,
    answerCount: overview.rows.length,
    livestockCount: overview.livestockCount,
    householdsWithAnswers: overview.interviewCount,
  };

  const categories_ = grids.categories.map<CategoryStat>((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    mainCategoryId: row.mainCategoryId,
    mainCategoryName: row.mainCategoryName,
    count: row.count,
  }));

  return {
    totals,
    categories: categories_,
    mc1Large: grids.mc1Large,
    mc2Small: grids.mc2Small,
    mc3Poultry: grids.mc3Poultry,
    mc4Summary: grids.mc4Summary,
  };
}
