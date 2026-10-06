"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
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
import type { SortState } from "@/types/ui";

export interface DataTableColumn<TRow> {
  /** Stable key, also the sort key the URL carries. */
  key: string;
  header: string;
  render: (row: TRow) => ReactNode;
  align?: "left" | "right";
  /**
   * Provide to make the column sortable. Omit it for action columns, which have
   * no meaningful order.
   */
  sortValue?: (row: TRow) => string | number;
  /** Extra classes for both the header cell and the body cells. */
  className?: string;
}

export interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow) => string | number;
  caption?: string;
  sort?: SortState | null;
  /** Called with the column key; the host decides how to sort. */
  onSortChange?: (key: string) => void;
  onRowClick?: (row: TRow) => void;
  /** Rendered in place of the body when there are no rows. */
  emptyState?: ReactNode;
  className?: string;
}

function ariaSort(
  columnKey: string,
  sort: SortState | null | undefined,
): "ascending" | "descending" | "none" {
  if (!sort || sort.key !== columnKey) {
    return "none";
  }
  return sort.direction === "asc" ? "ascending" : "descending";
}

/**
 * Table with client-side sortable headers and clickable rows.
 *
 * Sorting is delegated: the table reports the key that was clicked and the host
 * decides what to do with it. Over the mock data the host sorts the array it was
 * given; against an API it sends `?sort=&dir=`. That is the only reason this
 * component knows nothing about census records.
 *
 * The column callbacks mean this can only be rendered from a client component —
 * a server component cannot pass a function across the boundary. Hosts that want
 * to stay on the server should render the `ui/table` primitives directly.
 */
export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  caption,
  sort,
  onSortChange,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<TRow>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <Table>
        {caption ? <TableCaption>{caption}</TableCaption> : null}

        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const isSortable = Boolean(column.sortValue) && Boolean(onSortChange);
              const isSorted = sort?.key === column.key;
              const SortIcon = isSorted
                ? sort.direction === "asc"
                  ? ArrowUp
                  : ArrowDown
                : ArrowUpDown;

              return (
                <TableHead
                  key={column.key}
                  aria-sort={isSortable ? ariaSort(column.key, sort) : undefined}
                  className={cn(column.align === "right" && "text-right", column.className)}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(column.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded transition-colors hover:text-foreground",
                        column.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {column.header}
                      <SortIcon
                        aria-hidden
                        className={cn("size-3.5 shrink-0", isSorted ? "" : "opacity-40")}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => (
            // Clicking the row is a mouse convenience; the Actions cell holds a
            // real button, so keyboard users get the same route to the record
            // without a row being turned into a focusable widget.
            <TableRow
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && "cursor-pointer")}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(column.align === "right" && "text-right", column.className)}
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