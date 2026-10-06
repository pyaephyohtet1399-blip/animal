import { ChartColumn } from "lucide-react";

import { StatePanel } from "@/components/shared/state-panel";

export interface ChartEmptyStateProps {
  title: string;
  description?: string;
}

/**
 * Shown in place of a plot when the query returned no plottable values. Uses the
 * shared state panel so an empty chart looks like every other empty view.
 */
export function ChartEmptyState({ title, description }: ChartEmptyStateProps) {
  return (
    <StatePanel
      tone="empty"
      icon={ChartColumn}
      title={title}
      description={description}
      className="py-10"
    />
  );
}
