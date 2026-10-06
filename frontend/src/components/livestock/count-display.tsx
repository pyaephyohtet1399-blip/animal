import { cn } from "@/lib/cn";

export interface CountDisplayProps {
  /** A recorded `answer.count`. */
  count: number;
  className?: string;
}

/**
 * A single livestock figure. Counts are tabular so a column of them lines up and
 * a change in a digit does not shift the row.
 */
export function CountDisplay({ count, className }: CountDisplayProps) {
  return (
    <span className={cn("text-right text-sm font-semibold tabular-nums", className)}>
      {count}
    </span>
  );
}
