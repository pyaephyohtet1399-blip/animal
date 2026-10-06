"use client";

import { ActiveFilter } from "@/components/table/active-filter";
import { DateFilter } from "@/components/table/date-filter";
import { FilterSelect } from "@/components/table/filter-select";
import { TableToolbar } from "@/components/table/table-toolbar";
import { useDependentOptions } from "@/hooks/use-dependent-options";
import { CENSUS_COPY } from "@/config/census";
import { hasActiveFilters } from "@/lib/census";
import type {
  CensusDataset,
  CensusFilterState,
  FilterOption,
} from "@/types/census-records";

/** How a control changes the query. */
export type CensusUpdateMode = "push" | "replace";

export interface CensusFiltersProps {
  dataset: CensusDataset;
  state: CensusFilterState;
  /** Rows matching the query, shown in the summary line. */
  matchedCount: number;
  /**
   * Applies a change to the query. `replace` is for typing, so the history is not
   * filled with keystrokes.
   */
  onChange: (overrides: Partial<CensusFilterState>, mode?: CensusUpdateMode) => void;
  /** Clears every filter and the search box. */
  onClearAll: () => void;
}

/**
 * Search, filters and the applied-filter chips above the records table.
 *
 * Owns no records and no result set: it reads the current query and reports what
 * the user changed. The URL is the single place the query lives, so this and the
 * table can never disagree about what is being shown.
 */
export function CensusFilters({
  dataset,
  state,
  matchedCount,
  onChange,
  onClearAll,
}: CensusFiltersProps) {
  const { tractOptions, villageOptions, categoryOptions } = useDependentOptions(dataset, {
    townshipCode: state.townshipCode,
    tractCode: state.tractCode,
    mainCategoryId: state.mainCategoryId,
  });

  const chips = buildChips(dataset, state);

  return (
    <TableToolbar
      search={{
        label: CENSUS_COPY.search.label,
        placeholder: CENSUS_COPY.search.placeholder,
        value: state.query,
        onChange: (value) => onChange({ query: value }, "replace"),
      }}
      onClearAll={hasActiveFilters(state) ? onClearAll : undefined}
      activeFilters={chips.map((chip) => (
        <ActiveFilter
          key={chip.key}
          label={chip.label}
          value={chip.value}
          onRemove={() => onChange(chip.clear)}
        />
      ))}
      summary={
        <span>
          {matchedCount} of {dataset.records.length} records
        </span>
      }
    >
      <FilterSelect
        label={CENSUS_COPY.filters.township.label}
        allLabel={CENSUS_COPY.filters.township.all}
        value={state.townshipCode}
        options={dataset.townships}
        onChange={(value) =>
          onChange({ townshipCode: value, tractCode: null, villageCode: null })
        }
      />

      <FilterSelect
        label={CENSUS_COPY.filters.tract.label}
        allLabel={CENSUS_COPY.filters.tract.all}
        value={state.tractCode}
        options={tractOptions}
        onChange={(value) => onChange({ tractCode: value, villageCode: null })}
      />

      <FilterSelect
        label={CENSUS_COPY.filters.village.label}
        allLabel={CENSUS_COPY.filters.village.all}
        value={state.villageCode}
        options={villageOptions}
        onChange={(value) => onChange({ villageCode: value })}
      />

      <FilterSelect
        label={CENSUS_COPY.filters.mainCategory.label}
        allLabel={CENSUS_COPY.filters.mainCategory.all}
        value={state.mainCategoryId}
        options={dataset.mainCategories}
        onChange={(value) => onChange({ mainCategoryId: value, categoryId: null })}
      />

      <FilterSelect
        label={CENSUS_COPY.filters.category.label}
        allLabel={CENSUS_COPY.filters.category.all}
        value={state.categoryId}
        options={categoryOptions}
        onChange={(value) => onChange({ categoryId: value })}
      />

      <DateFilter
        label={CENSUS_COPY.filters.date.label}
        from={state.dateFrom}
        to={state.dateTo}
        onChange={({ from, to }) => onChange({ dateFrom: from, dateTo: to }, "replace")}
      />
    </TableToolbar>
  );
}

interface FilterChip {
  key: string;
  label: string;
  value: string;
  clear: Partial<CensusFilterState>;
}

function labelOf(options: readonly FilterOption[], value: string | null): string | null {
  if (!value) {
    return null;
  }
  return options.find((option) => option.value === value)?.label ?? value;
}

/** One chip per applied filter. Clearing a parent also clears what it narrowed. */
function buildChips(
  dataset: CensusDataset,
  state: CensusFilterState,
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (state.query.trim()) {
    chips.push({
      key: "query",
      label: CENSUS_COPY.searchChipLabel,
      value: state.query.trim(),
      clear: { query: "" },
    });
  }

  if (state.townshipCode) {
    chips.push({
      key: "township",
      label: CENSUS_COPY.filters.township.label,
      value: labelOf(dataset.townships, state.townshipCode) ?? "",
      clear: { townshipCode: null, tractCode: null, villageCode: null },
    });
  }

  if (state.tractCode) {
    chips.push({
      key: "tract",
      label: CENSUS_COPY.filters.tract.label,
      value: labelOf(dataset.tracts, state.tractCode) ?? "",
      clear: { tractCode: null, villageCode: null },
    });
  }

  if (state.villageCode) {
    chips.push({
      key: "village",
      label: CENSUS_COPY.filters.village.label,
      value: labelOf(dataset.villages, state.villageCode) ?? "",
      clear: { villageCode: null },
    });
  }

  if (state.mainCategoryId) {
    chips.push({
      key: "mainCategory",
      label: CENSUS_COPY.filters.mainCategory.label,
      value: labelOf(dataset.mainCategories, state.mainCategoryId) ?? "",
      clear: { mainCategoryId: null, categoryId: null },
    });
  }

  if (state.categoryId) {
    chips.push({
      key: "category",
      label: CENSUS_COPY.filters.category.label,
      value: labelOf(dataset.categories, state.categoryId) ?? "",
      clear: { categoryId: null },
    });
  }

  if (state.dateFrom || state.dateTo) {
    chips.push({
      key: "date",
      label: CENSUS_COPY.filters.date.label,
      value: `${state.dateFrom ?? "any"} → ${state.dateTo ?? "any"}`,
      clear: { dateFrom: null, dateTo: null },
    });
  }

  return chips;
}