/**
 * Reports content component with Survey Summary feature.
 *
 * This extends the existing ReportsContent to include a new Survey Summary button
 * that opens a frontend-only report summary UI organized by the 246 WDN columns.
 *
 * The button and summary are frontend-only - they reuse existing filtered data
 * and do not create new API calls or modify backend code.
 */
"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGetCensusDatasetQuery } from "@/services/api/censusApi";
import { ChartCard } from "@/components/charts/chart-card";
import type { ChartDatum } from "@/components/charts/chart-config";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
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
import type { ReportBundle } from "@/lib/reports";

import { SurveySummaryReport } from "@/components/report/SurveySummaryReport";
import { ExcelExportButton } from "@/components/report/ExcelExportButton";

export function ReportsContent() {
  const searchParams = useSearchParams();
  const { data: dataset, isError } = useGetCensusDatasetQuery();
  const errorMessage = isError ? null : null;

  const [showSurveySummary, setShowSurveySummary] = useState(false);

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

  useEffect(() => {
    if (!bundle?.records?.[0]) {
      console.log("🔴 bundle.records မရှိ:", bundle);
      return;
    }

    const r = bundle.records[0];
    console.log("═══════════ DEBUG START ═══════════");
    console.log("📋 Interview:", r.interview);
    console.log("📦 Census object:", r.census);
    console.log("📊 Groups count:", r.census?.groups?.length ?? 0);
    console.log("🔢 Total count:", r.census?.totalCount ?? 0);
    console.log("📝 Answer count:", r.census?.answerCount ?? 0);

    r.census?.groups?.forEach((g, gi) => {
      console.log(`\n[Group ${gi}] ${g.mainCategoryId} - ${g.mainCategoryName}`);
      g.answers.forEach((a, ai) => {
        console.log(
          `  [${ai}] name="${a.categoryName}" catId="${a.categoryId}" ` +
          `age=${a.age} sex=${a.sex} count=${a.count}`
        );
      });
    });
    console.log("═══════════ DEBUG END ═══════════");
  }, [bundle]);

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={REPORT_COPY.title} subtitle={REPORT_COPY.titleMm} />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {errorMessage}
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

  const livestockByCategory: ChartDatum[] = bundle.categories
    .filter((row) => row.count > 0)
    .map((row) => ({ label: `${row.mainCategoryName}(${row.categoryName})`, value: row.count }));

  const chartCopy = REPORT_COPY.charts.livestockByCategory;

  return (
    <div className="flex flex-col gap-6 print-full-width">
      <PageHeader
        title={REPORT_COPY.title}
        subtitle={REPORT_COPY.titleMm}
        description={REPORT_COPY.description}
actions={
          <>
            <PrintButton />
            <ExcelExportButton
              dataset={dataset}
              scope={bundle?.scope || null}
              label="Excel ထုတ်ယူရန်"
            />
          </>
        }
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
          <ChartCard
            key={`category-${bundle.scopeLabel}`}
            title={chartCopy.title}
            titleMm={chartCopy.titleMm}
            description={chartCopy.description}
            total={bundle.totals.livestockCount}
            totalLabel={chartCopy.totalLabel}
            isEmpty={livestockByCategory.length === 0}
            emptyTitle={REPORT_COPY.noneTitle}
            emptyDescription={REPORT_COPY.noneDescription}
          >
            <HorizontalBarChart
              data={livestockByCategory}
              valueLabel={chartCopy.valueLabel}
              categoryLabel={chartCopy.categoryLabel}
              labelWidth={150}
            />
          </ChartCard>

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

      {/* Survey Summary Modal - appears when button is clicked */}
      <SurveySummaryReport
        data={bundle}
        isOpen={showSurveySummary}
        onClose={() => setShowSurveySummary(false)}
        expanded={false}
      />
    </div>
  );
}