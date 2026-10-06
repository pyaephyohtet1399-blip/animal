import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * Neutral placeholder block shown while data resolves. Always decorative, so
 * the surrounding component must provide its own accessible loading label.
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
