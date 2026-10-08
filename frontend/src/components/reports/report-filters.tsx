"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { DateFilter } from "@/components/table/date-filter";
import { FilterSelect } from "@/components/table/filter-select";
import { TableToolbar } from "@/components/table/table-toolbar";
import { useDependentOptions } from "@/hooks/use-dependent-options";
import { REPORT_COPY } from "@/config ori/reports";
import {
  EMPTY_REPORT_SCOPE,
  buildReportHref,
  hasReportScope,
  type ReportScope,
} from "@/lib/reports";
import type { CensusDataset } from "@/types/census-records";

export interface ReportFiltersProps {
  dataset: CensusDataset;
  scope: ReportScope;
  /** Plain-language description of what the reports currently cover. */
  scopeLabel: string;
}

/**
 * Report scope controls: township, village tract, village and census date.
 *
 * Like the records table, dependence is expressed by narrowing the option lists,
 * and every change is a URL change so a printed report can be reproduced from
 * the address bar alone. There is no search box: a report covers a defined
 * scope, it does not match free text. The toolbar itself never prints.
 */
export function ReportFilters({ dataset, scope, scopeLabel }: ReportFiltersProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const { tractOptions, villageOptions } = useDependentOptions(dataset, {
    townshipCode: scope.townshipCode,
    tractCode: scope.tractCode,
    mainCategoryId: null,
  });

  function navigate(next: ReportScope) {
    startTransition(() => {
      router.replace(buildReportHref(next), { scroll: false });
    });
  }

  const narrowed = hasReportScope(scope);

  return (
    <TableToolbar
      className="print-none"
      onClearAll={narrowed ? () => navigate(EMPTY_REPORT_SCOPE) : undefined}
      clearAllLabel={REPORT_COPY.clearScope}
      summary={scopeLabel}
    >
      <FilterSelect
        label={REPORT_COPY.filters.township.label}
        allLabel={REPORT_COPY.filters.township.all}
        value={scope.townshipCode}
        options={dataset.townships}
        onChange={(value) =>
          navigate({ ...scope, townshipCode: value, tractCode: null, villageCode: null })
        }
      />

      <FilterSelect
        label={REPORT_COPY.filters.tract.label}
        allLabel={REPORT_COPY.filters.tract.all}
        value={scope.tractCode}
        options={tractOptions}
        onChange={(value) => navigate({ ...scope, tractCode: value, villageCode: null })}
      />

      <FilterSelect
        label={REPORT_COPY.filters.village.label}
        allLabel={REPORT_COPY.filters.village.all}
        value={scope.villageCode}
        options={villageOptions}
        onChange={(value) => navigate({ ...scope, villageCode: value })}
      />

      <DateFilter
        label={REPORT_COPY.filters.date.label}
        from={scope.dateFrom}
        to={scope.dateTo}
        onChange={({ from, to }) => navigate({ ...scope, dateFrom: from, dateTo: to })}
      />
    </TableToolbar>
  );
}
