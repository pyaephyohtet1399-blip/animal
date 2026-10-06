import { useMemo } from "react";

import { childOptions } from "@/lib/census";
import type { CensusDataset, FilterOption } from "@/types/census-records";

/** The parent selections that decide which options a dependent filter offers. */
export interface FilterScope {
  townshipCode: string | null;
  tractCode: string | null;
  mainCategoryId: string | null;
}

export interface DependentOptions {
  tractOptions: FilterOption[];
  villageOptions: FilterOption[];
  categoryOptions: FilterOption[];
}

/**
 * Options for the dependent geography and animal-group filters.
 *
 * One implementation, because the census records table and the reports offer
 * the same filters over the same taxonomy and must narrow them identically: with
 * no parent chosen every option is offered, and choosing one narrows the level
 * below it. A village can be pinned to a tract, or to any tract inside the
 * chosen township.
 *
 * Pure derivation, so it is memoised rather than recomputed per render.
 */
export function useDependentOptions(
  dataset: CensusDataset,
  scope: FilterScope,
): DependentOptions {
  const { tracts, villages, categories } = dataset;

  return useMemo(() => {
    const tractOptions = childOptions(tracts, scope.townshipCode);

    let villageOptions: FilterOption[];
    if (scope.tractCode) {
      villageOptions = childOptions(villages, scope.tractCode);
    } else if (scope.townshipCode) {
      const tractCodes = new Set(
        tracts
          .filter((option) => option.parentCode === scope.townshipCode)
          .map((option) => option.value),
      );
      villageOptions = villages.filter((option) =>
        option.parentCode ? tractCodes.has(option.parentCode) : false,
      );
    } else {
      villageOptions = [...villages];
    }

    return {
      tractOptions,
      villageOptions,
      categoryOptions: childOptions(categories, scope.mainCategoryId),
    };
  }, [tracts, villages, categories, scope.townshipCode, scope.tractCode, scope.mainCategoryId]);
}