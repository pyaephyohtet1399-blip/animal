"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  /** 1-based index of the first row on this page, 0 when empty. */
  from: number;
  to: number;
  total: number;
  /** Rows per page, shown alongside the range so the numbers can be checked. */
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Noun for the rows, e.g. "records". */
  noun?: string;
}

/**
 * Page controls for a client-side result set.
 *
 * It asks only for the new page number, never for a slice, so the host can hand
 * the same component the response of a paged API later without changing it.
 */
export function Pagination({
  page,
  pageCount,
  from,
  to,
  total,
  pageSize,
  onPageChange,
  noun = "records",
}: PaginationProps) {
  if (total === 0) {
    return null;
  }

  const canGoBack = page > 1;
  const canGoForward = page < pageCount;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing {from}–{to} of {total} {noun}
        <span className="ml-2 text-muted-foreground/70">({pageSize} per page)</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoBack}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden />
          Previous
        </Button>

        <span className="text-xs text-muted-foreground tabular-nums">
          Page {page} of {pageCount}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={!canGoForward}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}