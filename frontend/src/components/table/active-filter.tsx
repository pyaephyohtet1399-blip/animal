"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/cn";

export interface ActiveFilterProps {
  /** What is being filtered, e.g. "Township". */
  label: string;
  /** The value currently applied, shown verbatim. */
  value: string;
  onRemove: () => void;
  className?: string;
}

/**
 * Chip describing one applied filter, with the control to drop it. Reading the
 * active query at a glance is the point: a long filter chain is otherwise easy
 * to lose track of.
 */
export function ActiveFilter({ label, value, onRemove, className }: ActiveFilterProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[18rem] items-center gap-1.5 rounded-md border border-border bg-secondary py-0.5 pr-1 pl-2 text-xs text-secondary-foreground",
        className,
      )}
    >
      <span className="font-medium">{label}:</span>
      <span className="truncate">{value}</span>
      <button
        type="button"
        aria-label={`Remove ${label.toLowerCase()} filter`}
        onClick={onRemove}
        className="flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-secondary-foreground/10"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}