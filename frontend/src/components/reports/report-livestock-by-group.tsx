"use client";

import { useMemo, useState } from "react";

import { CountDisplay } from "@/components/livestock/count-display";
import { GroupedTable, type GroupedColumn } from "@/components/reports/report-grouped-table";
import { McChart } from "@/components/reports/report-livestock";
import { ReportSection } from "@/components/reports/report-section";
import { Pagination } from "@/components/table/pagination";
import { paginate } from "@/lib/census";
import { REPORT_COPY } from "@/config/reports";
import type {
  LargeLivestockReportRow,
  LivestockSexSummaryRow,
  PoultryLivestockReportRow,
  SmallLivestockReportRow,
} from "@/lib/reports";
import { SIZE_CLASS_CODES } from "@/types/census";
import {
  MONTH_AGE_CLASS_CODES,
  YEAR_AGE_CLASS_CODES,
  maleTotal,
  type MonthAgeClassCode,
  type SexSplit,
  type YearAgeClassCode,
} from "@/lib/reports";

const REPORTS_PAGE_SIZE = 10;

interface LivestockGridRow {
  categoryId: string;
  categoryName: string;
  total: number;
}

const SEX_COLUMN = "px-1.5 text-[10px]";
const TOTAL_COLUMN = "px-2 text-[10px]";
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
  codes: readonly TCode[];
  labelOf: (code: TCode) => string;
  splitOf: (row: TRow, code: TCode) => SexSplit;
}

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

  return {
    columns,
    total,
    renderTable: (pageRows: TRow[]) => (
      <GroupedTable<TRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
        caption={`${copy.title} — ${rows.length} animal types`}
      />
    ),
    renderPrintTable: (pageRows: TRow[]) => (
      <GroupedTable<TRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
        caption={`${copy.title} — ${rows.length} animal types`}
      />
    ),
  };
}

interface PoultryGridResult {
  columns: GroupedColumn<PoultryLivestockReportRow>[];
  total: number;
  hasCastrated: boolean;
  renderTable: (pageRows: PoultryLivestockReportRow[]) => React.ReactNode;
  renderPrintTable: (pageRows: PoultryLivestockReportRow[]) => React.ReactNode;
}

function PoultryGrid({ copy, rows }: { copy: { title: string; titleMm: string; description: string }; rows: PoultryLivestockReportRow[] }): PoultryGridResult {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const hasCastrated = rows.some((row) =>
    SIZE_CLASS_CODES.some((code) => row.sizeGroups[code].castratedMale > 0),
  );

  const columns: GroupedColumn<PoultryLivestockReportRow>[] = SIZE_CLASS_CODES.flatMap<
    GroupedColumn<PoultryLivestockReportRow>
  >((code) => {
    const group = REPORT_COPY.sizeGroups[code];
    return [
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

  return {
    columns,
    total,
    hasCastrated,
    renderTable: (pageRows: PoultryLivestockReportRow[]) => (
      <GroupedTable<PoultryLivestockReportRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
        caption={`${copy.title} — ${rows.length} animal types`}
      />
    ),
    renderPrintTable: (pageRows: PoultryLivestockReportRow[]) => (
      <GroupedTable<PoultryLivestockReportRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
        caption={`${copy.title} — ${rows.length} animal types`}
      />
    ),
  };
}

interface SummaryGridResult {
  columns: GroupedColumn<LivestockSexSummaryRow>[];
  total: number;
  hasCastrated: boolean;
  renderTable: (pageRows: LivestockSexSummaryRow[]) => React.ReactNode;
  renderPrintTable: (pageRows: LivestockSexSummaryRow[]) => React.ReactNode;
}

function SummaryGrid({ copy, rows }: { copy: { title: string; titleMm: string; description: string }; rows: LivestockSexSummaryRow[] }): SummaryGridResult {
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const hasCastrated = rows.some((row) => row.castratedMale > 0);

  const columns: GroupedColumn<LivestockSexSummaryRow>[] = [
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

  return {
    columns,
    total,
    hasCastrated,
    renderTable: (pageRows: LivestockSexSummaryRow[]) => (
      <GroupedTable<LivestockSexSummaryRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
        caption={`${copy.title} — ${rows.length} animal types`}
      />
    ),
    renderPrintTable: (pageRows: LivestockSexSummaryRow[]) => (
      <GroupedTable<LivestockSexSummaryRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
        caption={`${copy.title} — ${rows.length} animal types`}
      />
    ),
  };
}

function chartRowsForLarge(rows: LargeLivestockReportRow[]) {
  return rows.map((row) => {
    let male = 0;
    let castratedMale = 0;
    let female = 0;
    for (const code of YEAR_AGE_CLASS_CODES) {
      const split = row.ageGroups[code];
      male += split.male;
      castratedMale += split.castratedMale;
      female += split.female;
    }
    return { categoryName: row.categoryName, male, castratedMale, female, total: row.total };
  });
}

function chartRowsForSmall(rows: SmallLivestockReportRow[]) {
  return rows.map((row) => {
    let male = 0;
    let castratedMale = 0;
    let female = 0;
    for (const code of MONTH_AGE_CLASS_CODES) {
      const split = row.ageGroups[code];
      male += split.male;
      castratedMale += split.castratedMale;
      female += split.female;
    }
    return { categoryName: row.categoryName, male, castratedMale, female, total: row.total };
  });
}

function chartRowsForPoultry(rows: PoultryLivestockReportRow[]) {
  return rows.map((row) => {
    let male = 0;
    let castratedMale = 0;
    let female = 0;
    for (const code of SIZE_CLASS_CODES) {
      const split = row.sizeGroups[code];
      male += split.male;
      castratedMale += split.castratedMale;
      female += split.female;
    }
    return { categoryName: row.categoryName, male, castratedMale, female, total: row.total };
  });
}

function chartRowsForMc4(rows: LivestockSexSummaryRow[]) {
  return rows.map((row) => ({
    categoryName: row.categoryName,
    male: row.male,
    castratedMale: row.castratedMale,
    female: row.female,
    total: row.total,
  }));
}

/** MC1 / တိရစ္ဆာန်ကြီး — year-based. */
export function Mc1Report({ rows }: { rows: LargeLivestockReportRow[] }) {
  const [page, setPage] = useState(1);
  const grid = useMemo(() => AgeGridReport<LargeLivestockReportRow, YearAgeClassCode>({
    copy: REPORT_COPY.reports.largeAnimals,
    rows,
    codes: YEAR_AGE_CLASS_CODES,
    labelOf: (code) => REPORT_COPY.ageGroups[code],
    splitOf: (row, code) => row.ageGroups[code],
  }), [rows]);

  const pageResult = useMemo(() => paginate(rows, page, REPORTS_PAGE_SIZE), [rows, page]);

  return (
    <ReportSection
      title={REPORT_COPY.reports.largeAnimals.title}
      titleMm={REPORT_COPY.reports.largeAnimals.titleMm}
      description={REPORT_COPY.reports.largeAnimals.description}
      meta={`${rows.length} animal types · ${grid.total}`}
      footer={REPORT_COPY.dimensionNote}
      breaksBefore
    >
      <McChart title={REPORT_COPY.reports.largeAnimals.title} titleMm={REPORT_COPY.reports.largeAnimals.titleMm} description={REPORT_COPY.reports.largeAnimals.description} rows={chartRowsForLarge(rows)} />
      <div className="print-none">
        {grid.renderTable(pageResult.rows)}
        {pageResult.pageCount > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              page={pageResult.page}
              pageCount={pageResult.pageCount}
              from={pageResult.from}
              to={pageResult.to}
              total={pageResult.total}
              pageSize={REPORTS_PAGE_SIZE}
              onPageChange={setPage}
              noun="animal types"
            />
          </div>
        )}
      </div>
      {pageResult.pageCount > 1 ? (
        <div className="print-only">
          {grid.renderPrintTable(pageResult.rows)}
        </div>
      ) : null}
    </ReportSection>
  );
}

/** MC2 / တိရစ္ဆာန်ငယ် — month-based. */
export function Mc2Report({ rows }: { rows: SmallLivestockReportRow[] }) {
  const [page, setPage] = useState(1);
  const grid = useMemo(() => AgeGridReport<SmallLivestockReportRow, MonthAgeClassCode>({
    copy: REPORT_COPY.reports.smallAnimals,
    rows,
    codes: MONTH_AGE_CLASS_CODES,
    labelOf: (code) => REPORT_COPY.ageGroups[code],
    splitOf: (row, code) => row.ageGroups[code],
  }), [rows]);

  const pageResult = useMemo(() => paginate(rows, page, REPORTS_PAGE_SIZE), [rows, page]);

  return (
    <ReportSection
      title={REPORT_COPY.reports.smallAnimals.title}
      titleMm={REPORT_COPY.reports.smallAnimals.titleMm}
      description={REPORT_COPY.reports.smallAnimals.description}
      meta={`${rows.length} animal types · ${grid.total}`}
      footer={REPORT_COPY.dimensionNote}
      breaksBefore
    >
      <McChart title={REPORT_COPY.reports.smallAnimals.title} titleMm={REPORT_COPY.reports.smallAnimals.titleMm} description={REPORT_COPY.reports.smallAnimals.description} rows={chartRowsForSmall(rows)} />
      <div className="print-none">
        {grid.renderTable(pageResult.rows)}
        {pageResult.pageCount > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              page={pageResult.page}
              pageCount={pageResult.pageCount}
              from={pageResult.from}
              to={pageResult.to}
              total={pageResult.total}
              pageSize={REPORTS_PAGE_SIZE}
              onPageChange={setPage}
              noun="animal types"
            />
          </div>
        )}
      </div>
      {pageResult.pageCount > 1 ? (
        <div className="print-only">
          {grid.renderPrintTable(pageResult.rows)}
        </div>
      ) : null}
    </ReportSection>
  );
}

/** MC3 / ကြက်/ဘဲ/ငုံး — size-based. */
export function Mc3Report({ rows }: { rows: PoultryLivestockReportRow[] }) {
  const [page, setPage] = useState(1);
  const grid = useMemo(() => PoultryGrid({ copy: REPORT_COPY.reports.poultry, rows }), [rows]);
  const pageResult = useMemo(() => paginate(rows, page, REPORTS_PAGE_SIZE), [rows, page]);

  return (
    <ReportSection
      title={REPORT_COPY.reports.poultry.title}
      titleMm={REPORT_COPY.reports.poultry.titleMm}
      description={REPORT_COPY.reports.poultry.description}
      meta={`${rows.length} animal types · ${grid.total}`}
      footer={grid.hasCastrated ? REPORT_COPY.castratedNote : REPORT_COPY.dimensionNote}
      breaksBefore
    >
      <McChart title={REPORT_COPY.reports.poultry.title} titleMm={REPORT_COPY.reports.poultry.titleMm} description={REPORT_COPY.reports.poultry.description} rows={chartRowsForPoultry(rows)} />
      <div className="print-none">
        {grid.renderTable(pageResult.rows)}
        {pageResult.pageCount > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              page={pageResult.page}
              pageCount={pageResult.pageCount}
              from={pageResult.from}
              to={pageResult.to}
              total={pageResult.total}
              pageSize={REPORTS_PAGE_SIZE}
              onPageChange={setPage}
              noun="animal types"
            />
          </div>
        )}
      </div>
      {pageResult.pageCount > 1 ? (
        <div className="print-only">
          {grid.renderPrintTable(pageResult.rows)}
        </div>
      ) : null}
    </ReportSection>
  );
}

/** MC4 / မျိုးတိရစ္ဆာန် — no age/size grid. */
export function Mc4Report({ rows }: { rows: LivestockSexSummaryRow[] }) {
  const [page, setPage] = useState(1);
  const grid = useMemo(() => SummaryGrid({ copy: REPORT_COPY.reports.sexSummary, rows }), [rows]);
  const pageResult = useMemo(() => paginate(rows, page, REPORTS_PAGE_SIZE), [rows, page]);

  return (
    <ReportSection
      title={REPORT_COPY.reports.sexSummary.title}
      titleMm={REPORT_COPY.reports.sexSummary.titleMm}
      description={REPORT_COPY.reports.sexSummary.description}
      meta={`${rows.length} animal types · ${grid.total}`}
      footer={grid.hasCastrated ? REPORT_COPY.castratedNote : undefined}
      breaksBefore
    >
      <McChart title={REPORT_COPY.reports.sexSummary.title} titleMm={REPORT_COPY.reports.sexSummary.titleMm} description={REPORT_COPY.reports.sexSummary.description} rows={chartRowsForMc4(rows)} />
      <div className="print-none">
        {grid.renderTable(pageResult.rows)}
        {pageResult.pageCount > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              page={pageResult.page}
              pageCount={pageResult.pageCount}
              from={pageResult.from}
              to={pageResult.to}
              total={pageResult.total}
              pageSize={REPORTS_PAGE_SIZE}
              onPageChange={setPage}
              noun="animal types"
            />
          </div>
        )}
      </div>
      {pageResult.pageCount > 1 ? (
        <div className="print-only">
          {grid.renderPrintTable(pageResult.rows)}
        </div>
      ) : null}
    </ReportSection>
  );
}
