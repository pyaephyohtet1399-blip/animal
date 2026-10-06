"use client";

import { Button } from "@/components/ui/button";
import { CountDisplay } from "@/components/livestock/count-display";
import type { DataTableColumn } from "@/components/table/data-table";
import { CENSUS_COPY } from "@/config/census";
import type { CensusRecord } from "@/types/census-records";

export interface CensusColumnsProps {
  /** Called with the record whose Details button was pressed. */
  onOpen: (record: CensusRecord) => void;
}

/**
 * Column definitions for the census records table.
 *
 * Kept apart from the table because it is a static description, not behaviour:
 * the same list can drive a server-rendered table, a CSV export or a report
 * without being retyped. Opening a record is the only interaction, so it arrives
 * as a callback.
 */
export function buildCensusColumns({
  onOpen,
}: CensusColumnsProps): DataTableColumn<CensusRecord>[] {
  return [
    {
      key: "h_name",
      header: CENSUS_COPY.columns.respondent,
      sortValue: (row) => row.interview.h_name,
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.interview.h_name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            p_Id {row.interview.p_Id}
          </span>
        </span>
      ),
    },
    {
      key: "township",
      header: CENSUS_COPY.columns.township,
      sortValue: (row) => row.township?.name ?? "",
      render: (row) => row.township?.name ?? "—",
    },
    {
      key: "tract",
      header: CENSUS_COPY.columns.tract,
      sortValue: (row) => row.tract?.name ?? "",
      render: (row) => row.tract?.name ?? "—",
    },
    {
      key: "village",
      header: CENSUS_COPY.columns.village,
      sortValue: (row) => row.village?.name ?? "",
      render: (row) =>
        row.village ? (
          <span className="flex flex-col">
            <span>{row.village.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.village.code}
            </span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "ans_date",
      header: CENSUS_COPY.columns.censusDate,
      sortValue: (row) => row.interview.ans_date,
      render: (row) => (
        <span className="font-mono text-xs tabular-nums">{row.interview.ans_date}</span>
      ),
    },
    {
      key: "livestock",
      header: CENSUS_COPY.columns.livestock,
      align: "right",
      sortValue: (row) => row.livestockCount,
      render: (row) => <CountDisplay count={row.livestockCount} />,
    },
    {
      key: "actions",
      header: CENSUS_COPY.columns.actions,
      align: "right",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          aria-label={`${CENSUS_COPY.rowHint} for ${row.interview.h_name}`}
          onClick={(event) => {
            // The row itself also opens the record; keep one click from firing
            // the handler twice.
            event.stopPropagation();
            onOpen(row);
          }}
        >
          Details
        </Button>
      ),
    },
  ];
}