import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

export interface ReportSectionProps {
  title: string;
  titleMm?: string;
  description?: string;
  /** Small summary printed next to the heading, e.g. "4 rows · 108 animals". */
  meta?: string;
  /** Table or chart. */
  children: ReactNode;
  /** Rendered under the body, e.g. a footnote. */
  footer?: ReactNode;
  /** Start a new printed page before this section. */
  breaksBefore?: boolean;
  className?: string;
}

/**
 * Frame for one report: heading, meta, body, footnote.
 *
 * Reports are read on paper, so the heading is marked to stay with its body
 * across a page break, and nothing here draws a border the printer would have to
 * render as a heavy box.
 */
export function ReportSection({
  title,
  titleMm,
  description,
  meta,
  children,
  footer,
  breaksBefore = false,
  className,
}: ReportSectionProps) {
  return (
    <Card
      className={cn(
        "print-keep-together gap-0 overflow-hidden p-0",
        breaksBefore && "print-break-before",
        className,
      )}
    >
      <CardHeader className="print-keep-together">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            {titleMm ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{titleMm}</p>
            ) : null}
          </div>
          {meta ? (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {meta}
            </span>
          ) : null}
        </div>

        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent className="px-0 py-0">{children}</CardContent>

      {footer ? (
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}