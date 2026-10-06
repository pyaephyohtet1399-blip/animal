"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReportFilters } from "@/components/reports/report-filters";
import {
  Mc1Report,
  Mc2Report,
  Mc3Report,
  Mc4Report,
} from "@/components/reports/report-livestock-by-group";
import { TractReport, VillageReport } from "@/components/reports/report-tables";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { StatePanel } from "@/components/shared/state-panel";
import { StatCard } from "@/components/shared/stat-card";
import { REPORT_COPY } from "@/config/reports";
import { buildReportBundle, parseReportScope } from "@/lib/reports";
import { getCensusDataset } from "@/lib/repositories/census";
import type { CensusDataset } from "@/types/census-records";
import type { ReportBundle } from "@/lib/reports";

export function ReportsContent() {
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

  const bundle: ReportBundle | null = useMemo(() => {
    if (!dataset) return null;
    return buildReportBundle(dataset, parseReportScope(searchParamsRecord));
  }, [dataset, searchParamsRecord]);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={REPORT_COPY.title} subtitle={REPORT_COPY.titleMm} />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!dataset || !bundle) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={REPORT_COPY.title} subtitle={REPORT_COPY.titleMm} />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const hasRecords = bundle.totals.interviewCount > 0;

  return (
    <div className="flex flex-col gap-6 print-full-width">
      <PageHeader
        title={REPORT_COPY.title}
        subtitle={REPORT_COPY.titleMm}
        description={REPORT_COPY.description}
        actions={<PrintButton />}
      />

      <ReportFilters
        dataset={dataset}
        scope={bundle.scope}
        scopeLabel={bundle.scopeLabel}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={REPORT_COPY.totals.interviews.label}
          labelMm={REPORT_COPY.totals.interviews.labelMm}
          value={bundle.totals.interviewCount}
        />
        <StatCard
          label={REPORT_COPY.totals.livestock.label}
          labelMm={REPORT_COPY.totals.livestock.labelMm}
          value={bundle.totals.livestockCount}
        />
        <StatCard
          label={REPORT_COPY.totals.villages.label}
          labelMm={REPORT_COPY.totals.villages.labelMm}
          value={bundle.totals.villageCount}
        />
        <StatCard
          label={REPORT_COPY.totals.tracts.label}
          labelMm={REPORT_COPY.totals.tracts.labelMm}
          value={bundle.totals.tractCount}
        />
      </div>

      {hasRecords ? (
        <>
          <TractReport key={`tract-${bundle.scopeLabel}`} rows={bundle.tracts} />
          <VillageReport key={`village-${bundle.scopeLabel}`} rows={bundle.villages} />
          {bundle.mc1Large.length > 0 ? (
            <Mc1Report key={`mc1-${bundle.scopeLabel}`} rows={bundle.mc1Large} />
          ) : null}
          {bundle.mc2Small.length > 0 ? (
            <Mc2Report key={`mc2-${bundle.scopeLabel}`} rows={bundle.mc2Small} />
          ) : null}
          {bundle.mc3Poultry.length > 0 ? (
            <Mc3Report key={`mc3-${bundle.scopeLabel}`} rows={bundle.mc3Poultry} />
          ) : null}
          {bundle.mc4Summary.length > 0 ? (
            <Mc4Report key={`mc4-${bundle.scopeLabel}`} rows={bundle.mc4Summary} />
          ) : null}
        </>
      ) : (
        <StatePanel
          tone="empty"
          title={REPORT_COPY.noneTitle}
          description={REPORT_COPY.noneDescription}
          className="rounded-lg border border-border bg-card"
        />
      )}

      <p className="print-only text-xs">{REPORT_COPY.coverNote}</p>
    </div>
  );
}
