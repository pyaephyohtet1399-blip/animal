import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * Plain, high-contrast table primitives. Dense enough for census data but with
 * generous horizontal padding so long Myanmar place names stay readable.
 */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div data-slot="table-wrapper" className="w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b border-border last:border-0 hover:bg-muted/60", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-10 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold tracking-wide uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-4 py-3 align-middle", className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("px-4 py-3 text-left text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}