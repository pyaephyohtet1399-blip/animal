"use client";

import { SexStackChart } from "@/components/reports/report-sex-stack-chart";
import { ReportSection } from "@/components/reports/report-section";
import { REPORT_COPY } from "@/config ori/reports";

export interface McChartProps {
  title: string;
  titleMm: string;
  description: string;
  rows: {
    categoryName: string;
    male: number;
    castratedMale: number;
    female: number;
    total: number;
  }[];
}

/**
 * One stacked horizontal bar per animal type, split by sex.
 *
 * Colour follows the sex, never the animal type, so the three shades mean the
 * same thing on every row.
 */
export function McChart({ title, titleMm, description, rows }: McChartProps) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <ReportSection
      title={title}
      titleMm={titleMm}
      description={description}
      meta={`${rows.length} animal types · ${total}`}
    >
      <div className="px-5 pt-4 print-keep-together">
        <SexStackChart
          data={rows.map((row) => ({
            label: row.categoryName,
            male: row.male,
            castratedMale: row.castratedMale,
            female: row.female,
            total: row.total,
          }))}
          legend={REPORT_COPY.sexes}
          valueLabel="Livestock"
          categoryLabel="Animal type"
          labelWidth={150}
        />
      </div>
    </ReportSection>
  );
}

