import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface ExplorerLayoutProps {
  children: ReactNode;
  /**
   * True while a selection change is being resolved. The columns stay mounted
   * and readable, they are only dimmed, so the eye does not lose its place.
   */
  isPending?: boolean;
  className?: string;
}

/**
 * Frame for a master-detail explorer: one column per level, side by side once
 * there is room for them and stacked above that. Columns stretch to a common
 * height so the three lists read as one table.
 */
export function ExplorerLayout({ children, isPending = false, className }: ExplorerLayoutProps) {
  return (
    <div
      aria-busy={isPending}
      className={cn(
        "grid items-stretch gap-4 lg:grid-cols-3",
        isPending && "opacity-60 transition-opacity",
        className,
      )}
    >
      {children}
    </div>
  );
}
