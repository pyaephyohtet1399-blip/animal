import { Inbox, type LucideIcon, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type StatePanelTone = "empty" | "error";

export interface StatePanelProps {
  tone: StatePanelTone;
  title: string;
  description?: string;
  /** Defaults to a neutral box for `empty` and a warning triangle for `error`. */
  icon?: LucideIcon;
  /** Primary call to action, e.g. a retry button or a "clear filters" link. */
  action?: ReactNode;
  /** Renders a retry button wired to a reload callback. */
  onRetry?: () => void;
  className?: string;
}

const TONE_STYLES: Record<StatePanelTone, string> = {
  empty: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
};

const TONE_ICONS: Record<StatePanelTone, LucideIcon> = {
  empty: Inbox,
  error: TriangleAlert,
};

/**
 * Single presentation for the two "nothing to show" cases: a collection with no
 * rows (`empty`) and a failed read (`error`). Feature pages must use this
 * instead of hand-rolling an empty table or an inline error paragraph.
 */
export function StatePanel({
  tone,
  title,
  description,
  icon,
  action,
  onRetry,
  className,
}: StatePanelProps) {
  const Icon = icon ?? TONE_ICONS[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          TONE_STYLES[tone],
        )}
      >
        <Icon aria-hidden className="size-5" />
      </span>

      <div className="max-w-sm">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
