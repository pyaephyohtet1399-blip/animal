"use client";

import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";

/**
 * A report table with two header levels.
 *
 * The livestock grids have one column per age class *and* per sex, which is nine
 * or ten numbers across; naming each of them would make the table wider than the
 * page. Instead an age class spans a group of columns, so the reader sees the
 * form's own shape — a heading, then the three sexes under it.
 *
 * `DataTable` deliberately has a single header row and no grouping, which is the
 * right call for the records table. This is the smallest thing the wide livestock
 * reports need, built from the same `ui/table` primitives so the print rule that
 * repeats `thead` on every page still applies.
 */

export interface GroupedColumn<TRow> {
  /** Heading this column sits under. Consecutive columns sharing one span it. */
  group?: string;
  header: string;
  align?: "left" | "right";
  render: (row: TRow) => ReactNode;
  /** Extra classes for both the header cell and the body cells. */
  className?: string;
}

export interface GroupedTableProps<TRow> {
  /** Leading column, naming what each row is about. */
  rowHeader: string;
  renderRowHeader: (row: TRow) => ReactNode;
  columns: GroupedColumn<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow) => string;
  caption?: string;
  className?: string;
}

interface HeaderRun<TRow> {
  /** `null` when the column has no group heading above it. */
  group: string | null;
  first: GroupedColumn<TRow>;
  span: number;
}

/** Collapse consecutive columns that share a group heading into one run. */
function headerRuns<TRow>(columns: GroupedColumn<TRow>[]): HeaderRun<TRow>[] {
  const runs: HeaderRun<TRow>[] = [];

  for (const column of columns) {
    const last = runs[runs.length - 1];
    if (last && column.group !== undefined && last.group === column.group) {
      last.span += 1;
    } else {
      runs.push({ group: column.group ?? null, first: column, span: 1 });
    }
  }

  return runs;
}

export function GroupedTable<TRow>({
  rowHeader,
  renderRowHeader,
  columns,
  rows,
  rowKey,
  caption,
  className,
}: GroupedTableProps<TRow>) {
  const runs = headerRuns(columns);
  // Columns without a group heading span both rows on their own, so a table of
  // only single-level columns needs one header row, not an empty one above it.
  const hasGroups = runs.some((run) => run.group !== null);

  const cellKey = (column: GroupedColumn<TRow>, index: number): string =>
    `${column.group ?? ""}-${column.header}-${index}`;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <Table>
        {caption ? <TableCaption>{caption}</TableCaption> : null}

        <TableHeader>
          {hasGroups ? (
            <TableRow>
              <TableHead rowSpan={2} className="text-left">
                {rowHeader}
              </TableHead>
              {runs.map((run) =>
                run.group === null ? (
                  <TableHead
                    key={cellKey(run.first, run.span)}
                    rowSpan={2}
                    className={cn(
                      run.first.align === "right" && "text-right",
                      run.first.className,
                    )}
                  >
                    {run.first.header}
                  </TableHead>
                ) : (
                  <TableHead
                    key={run.group}
                    colSpan={run.span}
                    scope="colgroup"
                    className="text-center"
                  >
                    {run.group}
                  </TableHead>
                ),
              )}
            </TableRow>
          ) : null}

          <TableRow>
            {hasGroups ? null : <TableHead className="text-left">{rowHeader}</TableHead>}
            {columns.map((column, index) => {
              if (hasGroups && column.group === undefined) {
                return null;
              }
              return (
                <TableHead
                  key={cellKey(column, index)}
                  className={cn(
                    column.align === "right" && "text-right",
                    hasGroups && column.group === undefined && "text-center",
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              <TableHead
                scope="row"
                className="h-auto whitespace-normal px-3 py-2 text-left align-middle text-xs font-semibold normal-case tracking-normal text-foreground"
              >
                {renderRowHeader(row)}
              </TableHead>
              {columns.map((column, index) => (
                <TableCell
                  key={cellKey(column, index)}
                  className={cn(
                    "px-2 py-2",
                    column.align === "right" && "text-right tabular-nums",
                    column.className,
                  )}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
