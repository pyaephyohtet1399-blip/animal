"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CensusRecordsView } from "@/components/census/census-records-view";
import { PageHeader } from "@/components/shared/page-header";
import { CENSUS_COPY } from "@/config/census";
import {
  normalizeCensusState,
  parseCensusState,
  selectCensusPage,
} from "@/lib/census";
import { getCensusDataset } from "@/lib/repositories/census";
import type { CensusDataset } from "@/types/census-records";

export function CensusContent() {
  const searchParams = useSearchParams();
  const [dataset, setDataset] = useState<CensusDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCensusDataset()
      .then(setDataset)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const searchParamsRecord = useMemo(() => {
    const record: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={CENSUS_COPY.title} subtitle={CENSUS_COPY.titleMm} />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
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
