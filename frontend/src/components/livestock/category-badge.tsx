import { cn } from "@/lib/cn";

export interface CategoryBadgeProps {
  /** `category.cat_name`. */
  name: string;
  /** `category.cat_id`, shown so the row can be traced back to the table. */
  id: string;
  /** Optional line under the name, e.g. the main category above it. */
  hint?: string;
  className?: string;
}

/**
 * An animal type from `category`.
 *
 * The code is kept next to the name because census staff read a category by its
 * code, and the optional hint is how the `category` -> `main_category`
 * relationship is made visible at the point it matters.
 */
export function CategoryBadge({ name, id, hint, className }: CategoryBadgeProps) {
  return (
    <span className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-sm">
          {name}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{id}</span>
      </span>

      {hint ? (
        <span className="truncate text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </span>
  );
}
