import type { ReactNode } from "react";

import { SearchInput, type SearchInputProps } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface TableToolbarProps {
  /** Omitted by screens that have a fixed scope rather than a searchable list. */
  search?: SearchInputProps;
  /** Filter controls. Laid out by the caller, usually a responsive grid. */
  children?: ReactNode;
  /** Chips describing what is currently applied. */
  activeFilters?: ReactNode;
  /** Result summary, e.g. "Showing 1–5 of 12 records". */
  summary?: ReactNode;
  /** Omitted when nothing is applied. */
  onClearAll?: () => void;
  clearAllLabel?: string;
  className?: string;
}

/**
 * Search, filters, applied-filter chips and the result summary, above a table.
 *
 * Deliberately unopinionated about the filters themselves — they arrive as
 * children — so the same bar serves a census table and a report scope.
 */
export function TableToolbar({
  search,
  children,
  activeFilters,
  summary,
  onClearAll,
  clearAllLabel = "Clear all",
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {search || onClearAll ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {search ? <SearchInput {...search} className="sm:max-w-xs sm:flex-1" /> : null}

          {onClearAll ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="shrink-0"
            >
              {clearAllLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {children ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      ) : null}

      {activeFilters ? (
        <div className="flex flex-wrap items-center gap-1.5">{activeFilters}</div>
      ) : null}

      {summary ? <div className="text-xs text-muted-foreground">{summary}</div> : null}
    </div>
  );
}