"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ReportSection } from "@/components/reports/report-section";
import { CountDisplay } from "@/components/livestock/count-display";
import { DataTable, type DataTableColumn } from "@/components/table/data-table";
import { Pagination } from "@/components/table/pagination";
import { paginate } from "@/lib/census";
import { REPORT_COPY } from "@/config/reports";
import type {
  TractReportRow,
  VillageReportRow,
} from "@/lib/reports";

const REPORTS_PAGE_SIZE = 10;

/** Interview records and livestock counted in each township. */
export function TownshipReport({ rows }: { rows: TractReportRow[] }) {
  const columns: DataTableColumn<TractReportRow>[] = [
    {
      key: "township",
      header: REPORT_COPY.columns.township,
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.townshipName}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {row.townshipId}
          </span>
        </span>
      ),
    },
    {
      key: "interviews",
      header: REPORT_COPY.columns.interviews,
      align: "right",
      render: (row) => <CountDisplay count={row.interviewCount} />,
    },
    {
      key: "livestock",
      header: REPORT_COPY.columns.livestock,
      align: "right",
      render: (row) => <CountDisplay count={row.livestockCount} />,
    },
  ];

  return (
    <ReportSection
      title={REPORT_COPY.reports.township.title}
      titleMm={REPORT_COPY.reports.township.titleMm}
      description={REPORT_COPY.reports.township.description}
      meta={`${rows.length} townships`}
    >
      <DataTable
        caption={`${REPORT_COPY.reports.township.title} — ${rows.length} townships`}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.townshipId}
      />
    </ReportSection>
  );
}

/** Villages, interview records and livestock counted in each tract. */
export function TractReport({ rows }: { rows: TractReportRow[] }) {
  const [page, setPage] = useState(1);

  const pageResult = useMemo(() => paginate(rows, page, REPORTS_PAGE_SIZE), [rows, page]);

  const columns: DataTableColumn<TractReportRow>[] = [
    {
      key: "tract",
      header: REPORT_COPY.columns.tract,
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.tractName}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.tractId}</span>
        </span>
      ),
    },
    {
      key: "township",
      header: REPORT_COPY.columns.townshipColumn,
      render: (row) => row.townshipName,
    },
    {
      key: "villages",
      header: REPORT_COPY.columns.villages,
      align: "right",
      render: (row) => <CountDisplay count={row.villageCount} />,
    },
    {
      key: "interviews",
      header: REPORT_COPY.columns.interviews,
      align: "right",
      render: (row) => <CountDisplay count={row.interviewCount} />,
    },
    {
      key: "livestock",
      header: REPORT_COPY.columns.livestock,
      align: "right",
      render: (row) => <CountDisplay count={row.livestockCount} />,
    },
  ];

  return (
    <ReportSection
      title={REPORT_COPY.reports.tract.title}
      titleMm={REPORT_COPY.reports.tract.titleMm}
      description={REPORT_COPY.reports.tract.description}
      meta={`${rows.length} tracts`}
      breaksBefore
    >
      {/* Screen: paginated rows + controls. */}
      <div className="print-none">
        <DataTable
          caption={`${REPORT_COPY.reports.tract.title} — ${rows.length} tracts`}
          columns={columns}
          rows={pageResult.rows}
          rowKey={(row) => row.tractId}
        />
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
              noun="tracts"
            />
          </div>
        )}
      </div>

      {/* Print: the full filtered set, not just the current screen page. */}
      {pageResult.pageCount > 1 ? (
        <div className="print-only">
          <DataTable
            caption={`${REPORT_COPY.reports.tract.title} — ${rows.length} tracts`}
            columns={columns}
            rows={rows}
            rowKey={(row) => row.tractId}
          />
        </div>
      ) : null}
    </ReportSection>
  );
}

/** Interviews, livestock and animal groups counted in each village. */
export function VillageReport({ rows }: { rows: VillageReportRow[] }) {
  const [page, setPage] = useState(1);

  const pageResult = useMemo(() => paginate(rows, page, REPORTS_PAGE_SIZE), [rows, page]);

  const columns: DataTableColumn<VillageReportRow>[] = [
    {
      key: "village",
      header: REPORT_COPY.columns.village,
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.villageName}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {row.villageId}
          </span>
        </span>
      ),
    },
    {
      key: "tract",
      header: REPORT_COPY.columns.tract,
      render: (row) => row.tractName,
    },
    {
      key: "township",
      header: REPORT_COPY.columns.townshipColumn,
      render: (row) => row.townshipName,
    },
    {
      key: "interviews",
      header: REPORT_COPY.columns.interviews,
      align: "right",
      render: (row) => <CountDisplay count={row.interviewCount} />,
    },
    {
      key: "livestock",
      header: REPORT_COPY.columns.livestock,
      align: "right",
      render: (row) => <CountDisplay count={row.livestockCount} />,
    },
    {
      key: "groups",
      header: REPORT_COPY.columns.animalGroups,
      render: (row) =>
        row.mainCategories.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {row.mainCategories.map((group) => (
              <Badge
                key={group.id}
                variant="outline"
                className="font-normal tabular-nums"
              >
                {group.name} {group.count}
              </Badge>
            ))}
          </span>
        ),
    },
  ];

  return (
    <ReportSection
      title={REPORT_COPY.reports.village.title}
      titleMm={REPORT_COPY.reports.village.titleMm}
      description={REPORT_COPY.reports.village.description}
      meta={`${rows.length} villages`}
      breaksBefore
    >
      <div className="print-none">
        <DataTable
          caption={`${REPORT_COPY.reports.village.title} — ${rows.length} villages`}
          columns={columns}
          rows={pageResult.rows}
          rowKey={(row) => row.villageId}
        />
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
              noun="villages"
            />
          </div>
        )}
      </div>

      {pageResult.pageCount > 1 ? (
        <div className="print-only">
          <DataTable
            caption={`${REPORT_COPY.reports.village.title} — ${rows.length} villages`}
            columns={columns}
            rows={rows}
            rowKey={(row) => row.villageId}
          />
        </div>
      ) : null}
    </ReportSection>
  );
}
