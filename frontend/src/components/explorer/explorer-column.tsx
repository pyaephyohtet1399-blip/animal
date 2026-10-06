import type { ReactNode } from "react";

import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface ExplorerColumnProps {
  title: string;
  titleMm: string;
  /** Records available at this level, before searching. */
  totalCount: number;
  /** Records left after searching; drives the footer summary. */
  resultCount: number;
  search: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
  children: ReactNode;
  isPending?: boolean;
}

/**
 * One level of the explorer: heading, record count, search box and the list
 * body. Every level renders through this component, so the three columns stay
 * identical apart from their data.
 */
export function ExplorerColumn({
  title,
  titleMm,
  totalCount,
  resultCount,
  search,
  children,
  isPending = false,
}: ExplorerColumnProps) {
  const isFiltered = search.value.trim().length > 0;

  const recordSummary = isFiltered
    ? `Showing ${resultCount} of ${totalCount}`
    : `${totalCount} ${totalCount === 1 ? "record" : "records"}`;

  return (
    <Card
      aria-busy={isPending}
      className="min-w-0 gap-0 overflow-hidden p-0 transition-opacity"
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
            <p className="truncate text-xs text-muted-foreground">{titleMm}</p>
          </div>
          <Badge variant="outline" className="shrink-0 font-normal tabular-nums">
            {totalCount}
          </Badge>
        </div>

        <SearchInput
          label={search.label}
          placeholder={search.placeholder}
          value={search.value}
          onChange={search.onChange}
          // The explorer list is already in memory; commit on every keystroke.
          debounceMs={0}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      <div className="shrink-0 border-t border-border px-4 py-2">
        <p className="text-xs text-muted-foreground tabular-nums">{recordSummary}</p>
      </div>
    </Card>
  );
}