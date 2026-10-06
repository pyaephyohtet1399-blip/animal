import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  /** Secondary line, usually the local-language label. */
  subtitle?: string;
  description?: string;
  /**
   * Trail shown above the title. Accepts any node so a feature can own its own
   * breadcrumb, e.g. `LocationBreadcrumb` on the explorer.
   */
  breadcrumb?: ReactNode;
  /** Buttons, filters or export actions aligned to the right. */
  actions?: ReactNode;
  className?: string;
}

/** Shared page heading. Used by every route so headings stay consistent. */
export function PageHeader({
  title,
  subtitle,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          ) : null}
        </div>

        {description ? (
          <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
