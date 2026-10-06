"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";

export interface DateFilterProps {
  label: string;
  /** Inclusive lower bound, ISO `YYYY-MM-DD`. */
  from: string | null;
  /** Inclusive upper bound, ISO `YYYY-MM-DD`. */
  to: string | null;
  onChange: (bounds: { from: string | null; to: string | null }) => void;
  className?: string;
}

/**
 * Inclusive date range over an ISO date column.
 *
 * Two native date inputs rather than a custom calendar: they are keyboard
 * operable, localised by the browser, and send the exact `YYYY-MM-DD` string the
 * data already uses, so there is nothing to parse or reformat. `max`/`min` stop
 * the user picking an inverted range in the first place.
 */
export function DateFilter({ label, from, to, onChange, className }: DateFilterProps) {
  const fromId = useId();
  const toId = useId();

  return (
    <div className={className}>
      <span className="mb-1 block truncate text-xs font-medium text-muted-foreground">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={fromId}>
          {label} from
        </label>
        <Input
          id={fromId}
          type="date"
          value={from ?? ""}
          max={to ?? undefined}
          onChange={(event) => onChange({ from: event.target.value || null, to })}
          className="h-9 min-w-0 px-2.5"
        />

        <span aria-hidden className="text-xs text-muted-foreground">
          –
        </span>

        <label className="sr-only" htmlFor={toId}>
          {label} to
        </label>
        <Input
          id={toId}
          type="date"
          value={to ?? ""}
          min={from ?? undefined}
          onChange={(event) => onChange({ from, to: event.target.value || null })}
          className="h-9 min-w-0 px-2.5"
        />
      </div>
    </div>
  );
}