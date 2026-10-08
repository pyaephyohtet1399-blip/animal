import { buildReportBundle, EMPTY_REPORT_SCOPE } from "@/lib/reports";
import type { CensusDataset, CensusRecord } from "@/types/census-records";
import type {
  CategoryStat,
  CensusTotals,
  DashboardStatistics,
  MainCategoryStat,
  RecentInterview,
  SexStat,
} from "@/types/statistics";

/**
 * District-wide statistics for the dashboard.
 *
 * The census records already carry their resolved geography and livestock
 * census, and `buildReportBundle` already aggregates the whole district by
 * township, animal type and sex. This module reuses both rather than walking the
 * raw tables a second time: one place decides how `answer` joins to `category`,
 * `main_category` and `restriction`, and everything downstream reads from it.
 *
 * Only the two things the dashboard needs and the reports do not provide are
 * added here — the full main-category list (including groups with no animals)
 * and the most recently answered households. The input is the cached dataset
 * from `useGetCensusDatasetQuery`, so opening the dashboard after the reports
 * costs no extra requests.
 */

/** How many households the dashboard lists under "recent". */
const RECENT_INTERVIEW_LIMIT = 6;

function toRecentInterview(record: CensusRecord): RecentInterview {
  return {
    p_Id: record.interview.p_Id,
    h_name: record.interview.h_name,
    ans_date: record.interview.ans_date,
    wvCode: record.interview.wvCode,
    villageName: record.village?.name ?? null,
    tractName: record.tract?.name ?? null,
    townshipName: record.township?.name ?? null,
    livestockCount: record.livestockCount,
  };
}

/**
 * Animal-group totals, including groups with nothing recorded, so the dashboard
 * can state that a group exists and holds zero rather than omitting it.
 */
function mainCategoryTotals(
  dataset: CensusDataset,
  categories: CategoryStat[],
): MainCategoryStat[] {
  const totals = new Map<string, number>();
  for (const category of categories) {
    totals.set(
      category.mainCategoryId,
      (totals.get(category.mainCategoryId) ?? 0) + category.count,
    );
  }

  return dataset.mainCategories.map((mainCategory) => ({
    mainCategoryId: mainCategory.value,
    mainCategoryName: mainCategory.label,
    count: totals.get(mainCategory.value) ?? 0,
  }));
}

/**
 * Sex totals. Only codes with animals are listed, matching the report: a code
 * with nothing behind it would be a bar of length zero.
 */
export function buildDashboardStatistics(dataset: CensusDataset): DashboardStatistics {
  // An empty scope, so the bundle covers the whole district.
  const bundle = buildReportBundle(dataset, EMPTY_REPORT_SCOPE);

  const totals: CensusTotals = {
    townshipCount: dataset.townships.length,
    townVillageCount: dataset.tracts.length,
    wardVillageCount: dataset.villages.length,
    interviewCount: bundle.totals.interviewCount,
    answerCount: bundle.totals.answerCount,
    livestockCount: bundle.totals.livestockCount,
    householdsWithAnswers: dataset.records.filter(
      (record) => record.answerCount > 0,
    ).length,
  };

  const recentInterviews = [...dataset.records]
    .sort(
      (a, b) =>
        b.interview.ans_date.localeCompare(a.interview.ans_date) ||
        b.interview.p_Id - a.interview.p_Id,
    )
    .slice(0, RECENT_INTERVIEW_LIMIT)
    .map(toRecentInterview);

  const categories: CategoryStat[] = bundle.categories.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    mainCategoryId: row.mainCategoryId,
    mainCategoryName: row.mainCategoryName,
    count: row.count,
  }));

  const sexes: SexStat[] = bundle.sexes.map((row) => ({
    code: row.code,
    label: row.label,
    count: row.count,
  }));

  return {
    totals,
    townships: bundle.townships,
    mainCategories: mainCategoryTotals(dataset, categories),
    categories,
    sexes,
    recentInterviews,
    records: dataset.records,
  };
}
