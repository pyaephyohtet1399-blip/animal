"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CensusRecordsView } from "@/components/census/census-records-view";
import { PageHeader } from "@/components/shared/page-header";
import { CENSUS_COPY } from "@/config ori/census";
import {
  normalizeCensusState,
  parseCensusState,
  selectCensusPage,
} from "@/lib/census";
import { apiErrorMessage } from "@/services/api/api-error";
import { useGetCensusDatasetQuery } from "@/services/api/censusApi";

export function CensusContent() {
  const searchParams = useSearchParams();
  const { data: dataset, error, isError } = useGetCensusDatasetQuery();
  const errorMessage = isError ? apiErrorMessage(error) : null;

  const searchParamsRecord = useMemo(() => {
    const record: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }, [searchParams]);

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={CENSUS_COPY.title} subtitle={CENSUS_COPY.titleMm} />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={CENSUS_COPY.title} subtitle={CENSUS_COPY.titleMm} />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const state = normalizeCensusState(parseCensusState(searchParamsRecord), dataset);
  const result = selectCensusPage(dataset.records, state);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={CENSUS_COPY.title}
        subtitle={CENSUS_COPY.titleMm}
        description={CENSUS_COPY.description}
      />

      <CensusRecordsView
        dataset={dataset}
        state={{ ...state, page: result.page }}
        rows={result.rows}
        matchedCount={result.total}
        from={result.from}
        to={result.to}
        pageCount={result.pageCount}
      />
    </div>
  );
}
