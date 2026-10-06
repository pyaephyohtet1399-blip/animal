"use client";

import { useMemo, useState } from "react";

import { CountDisplay } from "@/components/livestock/count-display";
import { GroupedTable, type GroupedColumn } from "@/components/reports/report-grouped-table";
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
  rows: TRow[];
  codes: readonly TCode[];
  labelOf: (code: TCode) => string;
  splitOf: (row: TRow, code: TCode) => SexSplit;
}

function AgeGridReport<TRow extends LivestockGridRow, TCode extends string>({
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
      />
    ),
    renderPrintTable: (pageRows: TRow[]) => (
      <GroupedTable<TRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
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

function PoultryGrid({ rows }: { rows: PoultryLivestockReportRow[] }): PoultryGridResult {
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
      />
    ),
    renderPrintTable: (pageRows: PoultryLivestockReportRow[]) => (
      <GroupedTable<PoultryLivestockReportRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
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

function SummaryGrid({ rows }: { rows: LivestockSexSummaryRow[] }): SummaryGridResult {
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
      />
    ),
    renderPrintTable: (pageRows: LivestockSexSummaryRow[]) => (
      <GroupedTable<LivestockSexSummaryRow>
        rowHeader={REPORT_COPY.columns.category}
        renderRowHeader={animalType}
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.categoryId}
      />
    ),
  };
}

/** MC1 / တိရစ္ဆာန်ကြီး — year-based. */
export function Mc1Report({ rows }: { rows: LargeLivestockReportRow[] }) {
  const [page, setPage] = useState(1);
  const grid = useMemo(() => AgeGridReport<LargeLivestockReportRow, YearAgeClassCode>({
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
  const grid = useMemo(() => PoultryGrid({ rows }), [rows]);
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
  const grid = useMemo(() => SummaryGrid({ rows }), [rows]);
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
