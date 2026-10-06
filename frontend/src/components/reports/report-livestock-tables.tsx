"use client";

import { CountDisplay } from "@/components/livestock/count-display";
import { GroupedTable, type GroupedColumn } from "@/components/reports/report-grouped-table";
import { ReportSection } from "@/components/reports/report-section";
import { REPORT_COPY } from "@/config/reports";
import {
  MONTH_AGE_CLASS_CODES,
  YEAR_AGE_CLASS_CODES,
  maleTotal,
  type LargeLivestockReportRow,
  type LivestockSexSummaryRow,
  type MonthAgeClassCode,
  type PoultryLivestockReportRow,
  type SexSplit,
  type SmallLivestockReportRow,
  type YearAgeClassCode,
} from "@/lib/reports";
import { SIZE_CLASS_CODES } from "@/types/census";

/**
 * The four livestock census tables.
 *
 * They are four tables rather than one wide one on purpose: the census form asks
 * the same questions of every animal type, but it asks them on different scales —
 * years for the large animals, months for the small ones, size for the birds —
 * so each table is only as wide as its own scale needs. The fourth drops the
 * scale altogether for a type-by-type male/female count.
 *
 * Every figure comes from the rows `buildReportBundle` built out of the scoped
 * census records, so these follow the report filters without any filter of their
 * own. A scope with no animals behind it produces no rows, not a table of zeros.
 */

/** What every livestock row has in common: which animal type it is. */
interface LivestockGridRow {
  categoryId: string;
  categoryName: string;
  total: number;
}

/** Header and body cells of a sex column, kept narrow so ten fit on a page. */
const SEX_COLUMN = "px-1.5 text-[10px]";
/** The trailing total column, a little wider than a sex column. */
const TOTAL_COLUMN = "px-2 text-[10px]";
/** Figures inside a cell, one size down from the header. */
const FIGURE = "text-xs font-medium";

function animalType(row: LivestockGridRow) {
  return (
    <span className="flex flex-col">
      <span className="font-medium">{row.categoryName}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{row.categoryId}</span>
    </span>
  );
}

function figure(count: number) {
  return <CountDisplay count={count} className={FIGURE} />;
}

/** A sex column that shows one figure of a `SexSplit`. */
function sexColumn<TRow extends LivestockGridRow>(
  group: string | undefined,
  header: string,
  read: (row: TRow) => number,
): GroupedColumn<TRow> {
  return {
    group,
    header,
    align: "right",
    className: SEX_COLUMN,
    render: (row) => figure(read(row)),
  };
}

interface AgeGridProps<TRow extends LivestockGridRow, TCode extends string> {
  copy: { title: string; titleMm: string; description: string };
  rows: TRow[];
  /** Age classes, in the order the census form asks for them. */
  codes: readonly TCode[];
  labelOf: (code: TCode) => string;
  splitOf: (row: TRow, code: TCode) => SexSplit;
}

/**
 * Shared body of the year-based and month-based tables: one group of three sex
 * columns per age class, then a total.
 */
function AgeGridReport<TRow extends LivestockGridRow, TCode extends string>({
  copy,
  rows,
  codes,
  labelOf,
  splitOf,
}: AgeGridProps<TRow, TCode>) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  const columns: GroupedColumn<TRow>[] = codes.flatMap<GroupedColumn<TRow>>((code) => {
    const group = labelOf(code);
    return [
      sexColumn<TRow>(group, REPORT_COPY.sexes.M, (row) => splitOf(row, code).male),
      sexColumn<TRow>(group, REPORT_COPY.sexes.MS, (row) => splitOf(row, code).castratedMale),
      sexColumn<TRow>(group, REPORT_COPY.sexes.F, (row) => splitOf(row, code).female),
    ];
  });

  columns.push({
    header: REPORT_COPY.columns.total,
    align: "right",
    className: TOTAL_COLUMN,
    render: (row) => figure(row.total),
  });

  return (
    <ReportSection
      title={copy.title}
      titleMm={copy.titleMm}
      description={copy.description}
      meta={`${rows.length} animal types · ${total}`}
      footer={REPORT_COPY.dimensionNote}
      breaksBefore
    >
      <GroupedTable<TRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.categoryId}
        caption={`${copy.title} — ${rows.length} animal types`}
      />
    </ReportSection>
  );
}

/** Animals counted on the year age classes. */
export function LargeLivestockReport({ rows }: { rows: LargeLivestockReportRow[] }) {
  return (
    <AgeGridReport<LargeLivestockReportRow, YearAgeClassCode>
      copy={REPORT_COPY.reports.largeAnimals}
      rows={rows}
      codes={YEAR_AGE_CLASS_CODES}
      labelOf={(code) => REPORT_COPY.ageGroups[code]}
      splitOf={(row, code) => row.ageGroups[code]}
    />
  );
}

/** Animals counted on the month age classes. */
export function SmallLivestockReport({ rows }: { rows: SmallLivestockReportRow[] }) {
  return (
    <AgeGridReport<SmallLivestockReportRow, MonthAgeClassCode>
      copy={REPORT_COPY.reports.smallAnimals}
      rows={rows}
      codes={MONTH_AGE_CLASS_CODES}
      labelOf={(code) => REPORT_COPY.ageGroups[code]}
      splitOf={(row, code) => row.ageGroups[code]}
    />
  );
}

/** Birds, counted young / middle / adult instead of by age. */
export function PoultryLivestockReport({ rows }: { rows: PoultryLivestockReportRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const hasCastrated = rows.some((row) =>
    SIZE_CLASS_CODES.some((code) => row.sizeGroups[code].castratedMale > 0),
  );

  const columns: GroupedColumn<PoultryLivestockReportRow>[] = SIZE_CLASS_CODES.flatMap<
    GroupedColumn<PoultryLivestockReportRow>
  >((code) => {
    const group = REPORT_COPY.sizeGroups[code];
    return [
      // The form asks for two sexes here, so the castrated males are counted
      // with the males rather than dropped; the footnote says so.
      sexColumn<PoultryLivestockReportRow>(group, REPORT_COPY.sexes.M, (row) =>
        maleTotal(row.sizeGroups[code]),
      ),
      sexColumn<PoultryLivestockReportRow>(group, REPORT_COPY.sexes.F, (row) =>
        row.sizeGroups[code].female,
      ),
    ];
  });

  columns.push({
    header: REPORT_COPY.columns.total,
    align: "right",
    className: TOTAL_COLUMN,
    render: (row) => figure(row.total),
  });

  return (
    <ReportSection
      title={REPORT_COPY.reports.poultry.title}
      titleMm={REPORT_COPY.reports.poultry.titleMm}
      description={REPORT_COPY.reports.poultry.description}
      meta={`${rows.length} animal types · ${total}`}
      footer={hasCastrated ? REPORT_COPY.castratedNote : REPORT_COPY.dimensionNote}
      breaksBefore
    >
      <GroupedTable<PoultryLivestockReportRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.categoryId}
        caption={`${REPORT_COPY.reports.poultry.title} — ${rows.length} animal types`}
      />
    </ReportSection>
  );
}

/** Male and female of every animal type, with no age or size column. */
export function LivestockSexSummaryReport({ rows }: { rows: LivestockSexSummaryRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const hasCastrated = rows.some((row) => row.castratedMale > 0);

  const columns: GroupedColumn<LivestockSexSummaryRow>[] = [
    // The form asks for two sexes here, so the castrated males are counted with
    // the males rather than dropped; the footnote says so.
    sexColumn<LivestockSexSummaryRow>(undefined, REPORT_COPY.sexes.M, (row) =>
      maleTotal(row),
    ),
    sexColumn<LivestockSexSummaryRow>(undefined, REPORT_COPY.sexes.F, (row) => row.female),
    {
      header: REPORT_COPY.columns.total,
      align: "right",
      className: TOTAL_COLUMN,
      render: (row) => figure(row.total),
    },
  ];

  return (
    <ReportSection
      title={REPORT_COPY.reports.sexSummary.title}
      titleMm={REPORT_COPY.reports.sexSummary.titleMm}
      description={REPORT_COPY.reports.sexSummary.description}
      meta={`${rows.length} animal types · ${total}`}
      footer={hasCastrated ? REPORT_COPY.castratedNote : undefined}
      breaksBefore
    >
      <GroupedTable<LivestockSexSummaryRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.categoryId}
        caption={`${REPORT_COPY.reports.sexSummary.title} — ${rows.length} animal types`}
      />
    </ReportSection>
  );
}
