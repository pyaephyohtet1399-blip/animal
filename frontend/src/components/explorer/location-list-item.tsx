"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { LocationNode } from "@/types/explorer";

export interface LocationListItemProps {
  node: LocationNode;
  isSelected: boolean;
  onSelect: (node: LocationNode) => void;
  /**
   * Trailing control rendered beside the row, e.g. a link to the node's own
   * page. Kept as a sibling of the button rather than nested inside it, so the
   * markup stays valid and both targets stay reachable by keyboard.
   */
  action?: ReactNode;
}

/**
 * One selectable location. Rendered as a button so keyboard users can walk the
 * hierarchy with Tab and activate a row with Enter or Space.
 *
 * The row carries both the name and the code from the source table — the code
 * is how census staff identify a place in the field.
 */
export function LocationListItem({ node, isSelected, onSelect, action }: LocationListItemProps) {
  return (
    <li className="group flex items-center rounded-md">
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(node)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-left transition-colors",
          "group-hover:bg-muted",
          isSelected && "bg-secondary text-secondary-foreground",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{node.name}</span>
          <span className="block truncate font-mono text-xs text-muted-foreground">
            {node.code}
          </span>
        </span>

        {isSelected ? (
          <Check aria-hidden className="size-4 shrink-0 text-secondary-foreground" />
        ) : null}
      </button>

      {action ? <div className="shrink-0 pr-1.5">{action}</div> : null}
    </li>
  );
}