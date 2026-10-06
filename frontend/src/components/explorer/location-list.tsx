import type { ReactNode } from "react";

import { LocationListItem } from "@/components/explorer/location-list-item";
import { cn } from "@/lib/cn";
import type { LocationNode } from "@/types/explorer";

export interface LocationListProps {
  /** Rows that survived the search. */
  items: readonly LocationNode[];
  /** Rows the level holds in total, before searching. */
  totalCount: number;
  /** Active search text, used to explain an empty result. */
  query: string;
  selectedCode: string | null;
  onSelect: (node: LocationNode) => void;
  /** Shown when the level has no records at all. */
  emptyState: ReactNode;
  /** Shown when records exist but the search text matches none. */
  noResultState: ReactNode;
  /** Names the list for assistive technology, e.g. "Townships". */
  ariaLabel?: string;
  /** Builds the trailing control for a row, e.g. a link to its own page. */
  renderAction?: (node: LocationNode) => ReactNode;
  className?: string;
}

/**
 * Scrollable list of locations for one explorer level.
 *
 * `items` and `totalCount` are passed separately so the list can tell "this
 * level is empty" apart from "this search found nothing" — two very different
 * messages for someone looking for a village.
 */
export function LocationList({
  items,
  totalCount,
  query,
  selectedCode,
  onSelect,
  emptyState,
  noResultState,
  ariaLabel,
  renderAction,
  className,
}: LocationListProps) {
  const hasRecords = totalCount > 0;
  const isEmptyResult = hasRecords && items.length === 0;

  if (!hasRecords) {
    return <div className={className}>{emptyState}</div>;
  }

  if (isEmptyResult) {
    return (
      <div className={className}>
        {noResultState ?? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query.trim()}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <ul aria-label={ariaLabel} className={cn("flex flex-col gap-0.5 p-1.5", className)}>
      {items.map((node) => (
        <LocationListItem
          key={node.code}
          node={node}
          isSelected={node.code === selectedCode}
          onSelect={onSelect}
          action={renderAction?.(node)}
        />
      ))}
    </ul>
  );
}