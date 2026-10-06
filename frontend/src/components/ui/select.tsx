import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * Native select styled to match `Input`.
 *
 * A native control is deliberate: census forms are long and must stay
 * operable on low-end phones, where a custom listbox is slower and harder to
 * use with a screen reader or a numeric keypad.
 */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-input bg-card py-2 pr-9 pl-3 text-sm text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
