import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

/**
 * Loading skeletons.
 *
 * Every route streams behind a `loading.tsx`, and each of those files would
 * otherwise repeat the same outer wrapper and the same block shapes. The pieces
 * live here so a skeleton is described by what it stands in for — a heading, a
 * filter row, a table — rather than by a wall of `<Skeleton>` elements.
 *
 * A skeleton must mirror the real layout closely enough that nothing shifts when
 * the data arrives, so the widths and heights here match the components they
 * stand in for.
 */

export interface LoadingShellProps {
  /** Announced to assistive technology while the page loads. */
  label: string;
  children: ReactNode;
  className?: string;
}

/** Outer frame: busy region plus the screen-reader label. */
export function LoadingShell({ label, children, className }: LoadingShellProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn("flex flex-col gap-6", className)}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Stands in for `PageHeader`. */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
  );
}

/** Stands in for a row of `StatCard`s. */
export function StatCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  /** Override the grid so it matches the real page's column count. */
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Stands in for a `Card` with a heading and a body. */
export function CardSkeleton({
  titleWidth = "w-48",
  bodyHeight = "h-48",
}: {
  titleWidth?: string;
  bodyHeight?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <Skeleton className={cn("h-4", titleWidth)} />
      <Skeleton className={cn("w-full", bodyHeight)} />
    </div>
  );
}

/** Stands in for a `Table`: header row plus `rows` body rows. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }, (_, rowIndex) => (
        <Skeleton key={rowIndex} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Stands in for a column of a list: a heading, a control, and the list body. */
export function ColumnSkeleton({ bodyHeight = "h-64" }: { bodyHeight?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className={cn("w-full", bodyHeight)} />
    </div>
  );
}

/** Stands in for a row of filter controls. */
export function FilterRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}