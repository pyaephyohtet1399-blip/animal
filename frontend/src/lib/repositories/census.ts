import { EMPTY_LIVESTOCK_CENSUS } from "@/types/livestock";
import type {
  Category,
  InterviewInfo,
  MainCategory,
  Township,
  TownVillage,
  WardVillage,
} from "@/types/census";
import type {
  CensusDataset,
  CensusRecord,
  FilterOption,
} from "@/types/census-records";
import type { LivestockCensus } from "@/types/livestock";

/**
 * Assembly of the census records table.
 *
 * One row is one `interview_info` record. Its livestock figures and the
 * categories behind them come from the Phase 05 resolver, so the join is
 * written once; this module only attaches the geography names and builds the
 * filter option lists. Fetching itself lives in `censusApi`, which caches each
 * source through RTK Query before handing them here.
 */
export interface CensusDatasetSources {
  townships: Township[];
  townVillages: TownVillage[];
  wardVillages: WardVillage[];
  interviews: InterviewInfo[];
  /** Resolved livestock census keyed by `p_Id`. */
  censusById: Record<string, LivestockCensus>;
  categories: Category[];
  mainCategories: MainCategory[];
}

export function assembleCensusDataset(
  sources: CensusDatasetSources,
): CensusDataset {
  const { townships, townVillages, wardVillages, interviews, censusById, categories, mainCategories } =
    sources;

  const townshipByCode = new Map(townships.map((row) => [row.tspCode, row]));
  const tractByCode = new Map(townVillages.map((row) => [row.tvgCode, row]));
  const villageByCode = new Map(wardVillages.map((row) => [row.wvCode, row]));

  const records: CensusRecord[] = interviews.map((interview) => {
    const village = villageByCode.get(interview.wvCode);
    const tract = village ? tractByCode.get(village.tvgCode) : undefined;
    const township = tract ? townshipByCode.get(tract.tspCode) : undefined;
    const census = censusById[String(interview.p_Id)] ?? EMPTY_LIVESTOCK_CENSUS;

    return {
      interview,
      township: township ? { code: township.tspCode, name: township.tspName } : null,
      tract: tract ? { code: tract.tvgCode, name: tract.tvgName } : null,
      village: village ? { code: village.wvCode, name: village.wvName } : null,
      livestockCount: census.totalCount,
      answerCount: census.answerCount,
      mainCategoryIds: [...new Set(census.groups.map((group) => group.mainCategoryId))],
      categoryIds: [
        ...new Set(census.groups.flatMap((group) => group.answers.map((a) => a.categoryId))),
      ],
      census,
    };
  });

  return {
    records,
    townships: townships.map((row) => ({
      value: row.tspCode,
      label: row.tspName,
      parentCode: null,
    })),
    tracts: townVillages.map((row) => ({
      value: row.tvgCode,
      label: row.tvgName,
      parentCode: row.tspCode,
    })),
    villages: wardVillages.map((row) => ({
      value: row.wvCode,
      label: row.wvName,
      parentCode: row.tvgCode,
    })),
    dates: distinctDates(records),
    mainCategories: mainCategories.map((row) => ({
      value: row.mcat_id,
      label: row.name,
      parentCode: null,
    })),
    categories: categories.map((row) => ({
      value: row.cat_id,
      label: row.cat_name,
      parentCode: row.mcat_id,
    })),
  };
}

function distinctDates(records: CensusRecord[]): FilterOption[] {
  const seen = new Set(records.map((record) => record.interview.ans_date));

  return [...seen]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({ value: date, label: date, parentCode: null }));
}
