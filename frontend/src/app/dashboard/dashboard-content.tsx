"use client";

import { useMemo } from "react";
import { ChartCard } from "@/components/charts/chart-card";
import type { ChartDatum } from "@/components/charts/chart-config";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary-cards";
import {
  Mc1Report,
  Mc2Report,
  Mc3Report,
  Mc4Report,
} from "@/components/reports/report-livestock-by-group";
import { PageHeader } from "@/components/shared/page-header";
import { DASHBOARD_COPY } from "@/config ori/dashboard";
import { EMPTY_REPORT_SCOPE, buildReportBundle } from "@/lib/reports";
import { buildDashboardStatistics } from "@/lib/statistics";
import { apiErrorMessage } from "@/services/api/api-error";
import { useGetCensusDatasetQuery } from "@/services/api/censusApi";

export function DashboardContent() {
  const { data: dataset, error, isError } = useGetCensusDatasetQuery();
  const stats = useMemo(
    () => (dataset ? buildDashboardStatistics(dataset) : null),
    [dataset],
  );
  const bundle = useMemo(
    () => (dataset ? buildReportBundle(dataset, EMPTY_REPORT_SCOPE) : null),
    [dataset],
  );
  const errorMessage = isError ? apiErrorMessage(error) : null;

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={DASHBOARD_COPY.title} subtitle={DASHBOARD_COPY.titleMm} />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={DASHBOARD_COPY.title} subtitle={DASHBOARD_COPY.titleMm} />
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const livestockByCategory: ChartDatum[] = stats.categories.map((category) => ({
    label: `${category.mainCategoryName}(${category.categoryName})`,
    value: category.count,
  }));

  const copy = DASHBOARD_COPY;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={copy.title}
        subtitle={copy.titleMm}
        description={copy.description}
      />

      <DashboardSummaryCards totals={stats.totals} />

      <ChartCard
        title={copy.charts.livestockByCategory.title}
        titleMm={copy.charts.livestockByCategory.titleMm}
        description={copy.charts.livestockByCategory.description}
        total={stats.totals.livestockCount}
        totalLabel={copy.charts.livestockByCategory.totalLabel}
        isEmpty={livestockByCategory.length === 0}
        emptyTitle={copy.emptyChartTitle}
        emptyDescription={copy.emptyChartDescription}
      >
        <HorizontalBarChart
          data={livestockByCategory}
          valueLabel="Livestock"
          categoryLabel="Animal type"
          labelWidth={190}
        />
      </ChartCard>

      {bundle && bundle.mc1Large.length > 0 ? (
        <Mc1Report rows={bundle.mc1Large} />
      ) : null}
      {bundle && bundle.mc2Small.length > 0 ? (
        <Mc2Report rows={bundle.mc2Small} />
      ) : null}
      {bundle && bundle.mc3Poultry.length > 0 ? (
        <Mc3Report rows={bundle.mc3Poultry} />
      ) : null}
      {bundle && bundle.mc4Summary.length > 0 ? (
        <Mc4Report rows={bundle.mc4Summary} />
      ) : null}
    </div>
  );
}
