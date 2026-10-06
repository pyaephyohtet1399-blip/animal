import type { ReactNode } from "react";

import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CountDisplay } from "@/components/livestock/count-display";
import { cn } from "@/lib/cn";

export interface ChartCardProps {
  title: string;
  /** Local-language subtitle. */
  titleMm?: string;
  description?: string;
  /** Aggregate shown next to the title, e.g. the column total. */
  total?: number;
  totalLabel?: string;
  /** Renders the empty state instead of the children. */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Surface for one chart: heading, optional total, the plot, and a footer for
 * the note that explains how the figures were derived. Handles the empty case
 * itself so no dashboard screen has to repeat that branch.
 */
export function ChartCard({
  title,
  titleMm,
  description,
  total,
  totalLabel,
  isEmpty = false,
  emptyTitle = "No data to chart",
  emptyDescription,
  footer,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            {titleMm ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{titleMm}</p>
            ) : null}
          </div>

          {typeof total === "number" ? (
            <div className="flex shrink-0 flex-col items-end">
              <CountDisplay count={total} className="text-lg" />
              {totalLabel ? (
                <span className="text-xs text-muted-foreground">{totalLabel}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent className={cn(isEmpty && "px-0 pb-0")}>
        {isEmpty ? (
          <ChartEmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </CardContent>

      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
