import Image from "next/image";
import { APP_SHORT_NAME, DISTRICT_NAME_MM } from "@/config ori/app";
import { cn } from "@/lib/cn";

export interface BrandProps {
  /** Hides the wordmark and keeps only the emblem (compact placements). */
  compact?: boolean;
  className?: string;
}

/** Shared brand component for the sidebar and compact top bar. */
export function Brand({ compact = false, className }: BrandProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {/* Logo */}
      <div className="relative flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/10">
        <Image
          src="/images/animal_logo.png"
          alt="Animal Collection Management System Logo"
          width={80}
          height={80}
          priority
          className="h-full w-full object-contain"
        />
      </div>

      {/* Brand name */}
      {compact ? null : (
        <div className="flex min-w-0 flex-col justify-center gap-0.5">
          <span className="truncate text-sm font-bold leading-5 tracking-tight text-foreground">
            {APP_SHORT_NAME}
          </span>

          <span className="truncate text-xs leading-4 text-muted-foreground">
            {DISTRICT_NAME_MM}
          </span>
        </div>
      )}
    </div>
  );
}