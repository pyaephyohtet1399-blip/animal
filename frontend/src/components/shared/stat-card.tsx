import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  /** Local-language label shown under the English one. */
  labelMm?: string;
  value: string | number;
  /** Context for the number, e.g. "across 4 townships". */
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Single key figure. Counts stay tabular so a row of tiles lines up, and the
 * icon is decorative because the label already names the figure.
 */
export function StatCard({ label, labelMm, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          {labelMm ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{labelMm}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Icon aria-hidden className="size-4" />
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
