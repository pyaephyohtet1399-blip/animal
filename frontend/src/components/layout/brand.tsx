import { Sprout } from "lucide-react";

import { APP_SHORT_NAME, DISTRICT_NAME_MM } from "@/config/app";
import { cn } from "@/lib/cn";

export interface BrandProps {
  /** Hides the wordmark and keeps only the emblem (compact placements). */
  compact?: boolean;
  className?: string;
}

/** Single brand block, reused by the sidebar and the compact top bar. */
export function Brand({ compact = false, className }: BrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Sprout className="size-5" aria-hidden />
      </span>
      {compact ? null : (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold tracking-tight">
            {APP_SHORT_NAME}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {DISTRICT_NAME_MM}
          </span>
        </span>
      )}
    </div>
  );
}