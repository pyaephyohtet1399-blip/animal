import { cn } from "@/lib/cn";
import type { DetailItem } from "@/types/ui";

export interface DetailListProps {
  items: DetailItem[];
  /**
   * `stacked` puts the label above the value and works in narrow columns,
   * `inline` puts them on one row and suits narrow side panels.
   */
  orientation?: "stacked" | "inline";
  className?: string;
}

const EMPTY_VALUE = "—";

/**
 * Read-only label/value pairs. Every detail pane in the explorer and in the
 * village / interview / census screens renders through this component so field
 * presentation stays identical across features.
 */
export function DetailList({ items, orientation = "stacked", className }: DetailListProps) {
  const isInline = orientation === "inline";

  return (
    <dl
      className={cn(
        isInline
          ? "flex flex-col gap-2"
          : "grid gap-x-6 gap-y-3 sm:grid-cols-2 sm:gap-y-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            isInline
              ? "flex items-baseline justify-between gap-4"
              : "flex min-w-0 flex-col gap-0.5",
          )}
        >
          <dt
            className={cn(
              "shrink-0 text-muted-foreground",
              isInline ? "text-sm" : "text-xs font-medium tracking-wide uppercase",
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              "min-w-0 text-sm break-words",
              isInline && "text-right font-medium",
              (item.value === null || item.value === "") && "text-muted-foreground",
            )}
          >
            {item.value === null || item.value === "" ? EMPTY_VALUE : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
