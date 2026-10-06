"use client";

import { useEffect, useState } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { ChartCard } from "@/components/charts/chart-card";
import type { ChartDatum } from "@/components/charts/chart-config";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary-cards";
import { LivestockOverview } from "@/components/dashboard/livestock-overview";
import { RecentInterviews } from "@/components/dashboard/recent-interviews";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SEX_CHART_COLORS } from "@/components/charts/chart-config";
import { DASHBOARD_COPY } from "@/config/dashboard";
import { getDashboardStatistics } from "@/lib/statistics";
import type { DashboardStatistics } from "@/types/statistics";

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStatistics()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={DASHBOARD_COPY.title} subtitle={DASHBOARD_COPY.titleMm} />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
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

  const livestockByTownship: ChartDatum[] = stats.townships
    .filter((township) => township.livestockCount > 0)
    .map((township) => ({ label: township.townshipName, value: township.livestockCount }));

  const livestockByMainCategory: ChartDatum[] = stats.mainCategories
    .filter((group) => group.count > 0)
    .map((group) => ({ label: group.mainCategoryName, value: group.count }));

  const livestockByCategory: ChartDatum[] = stats.categories.map((category) => ({
    label: category.categoryName,
    value: category.count,
  }));

  const livestockBySex: ChartDatum[] = stats.sexes.map((sex) => ({
    label: sex.label ?? sex.code,
    value: sex.count,
    color: SEX_CHART_COLORS[sex.code],
  }));

  const interviewsByTownship: ChartDatum[] = stats.townships
    .filter((township) => township.interviewCount > 0)
    .map((township) => ({ label: township.townshipName, value: township.interviewCount }));

  const copy = DASHBOARD_COPY;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={copy.title}
        subtitle={copy.titleMm}
        description={copy.description}
      />

      <DashboardSummaryCards totals={stats.totals} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={copy.charts.livestockByTownship.title}
          titleMm={copy.charts.livestockByTownship.titleMm}
          description={copy.charts.livestockByTownship.description}
          total={stats.totals.livestockCount}
          totalLabel={copy.charts.livestockByTownship.totalLabel}
          isEmpty={livestockByTownship.length === 0}
          emptyTitle={copy.emptyChartTitle}
          emptyDescription={copy.emptyChartDescription}
        >
          <BarChart
            data={livestockByTownship}
            valueLabel="Livestock"
            categoryLabel="Township"
          />
        </ChartCard>

        <ChartCard
          title={copy.charts.livestockByMainCategory.title}
          titleMm={copy.charts.livestockByMainCategory.titleMm}
          description={copy.charts.livestockByMainCategory.description}
          total={stats.totals.livestockCount}
          totalLabel={copy.charts.livestockByMainCategory.totalLabel}
          isEmpty={livestockByMainCategory.length === 0}
          emptyTitle={copy.emptyChartTitle}
          emptyDescription={copy.emptyChartDescription}
        >
          <BarChart
            data={livestockByMainCategory}
            valueLabel="Livestock"
            categoryLabel="Main category"
          />
        </ChartCard>

        <ChartCard
          title={copy.charts.interviewsByTownship.title}
          titleMm={copy.charts.interviewsByTownship.titleMm}
          description={copy.charts.interviewsByTownship.description}
          total={stats.totals.interviewCount}
          totalLabel={copy.charts.interviewsByTownship.totalLabel}
          isEmpty={interviewsByTownship.length === 0}
          emptyTitle={copy.emptyChartTitle}
          emptyDescription={copy.emptyChartDescription}
        >
          <BarChart
            data={interviewsByTownship}
            valueLabel="Interviews"
            categoryLabel="Township"
          />
        </ChartCard>

        <ChartCard
          title={copy.charts.livestockBySex.title}
          titleMm={copy.charts.livestockBySex.titleMm}
          description={copy.charts.livestockBySex.description}
          total={stats.totals.livestockCount}
          totalLabel={copy.charts.livestockBySex.totalLabel}
          isEmpty={livestockBySex.length === 0}
          emptyTitle={copy.emptyChartTitle}
          emptyDescription={copy.emptyChartDescription}
          footer={
            <p className="text-xs text-muted-foreground">
              Bars use the sex codes stored on each restriction. A code with no
              definition in the DML is shown as the code itself.
            </p>
          }
        >
          <BarChart
            data={livestockBySex}
            valueLabel="Livestock"
            categoryLabel="Sex"
          />
        </ChartCard>
      </div>

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
          labelWidth={150}
        />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentInterviews interviews={stats.recentInterviews} />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{copy.livestockTitle}</CardTitle>
            <CardDescription>{copy.livestockDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <LivestockOverview
              totals={stats.totals}
              mainCategories={stats.mainCategories}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
