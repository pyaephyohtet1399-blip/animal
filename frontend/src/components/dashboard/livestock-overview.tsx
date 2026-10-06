import { CountDisplay } from "@/components/livestock/count-display";
import { LivestockSummary } from "@/components/livestock/livestock-summary";
import { Separator } from "@/components/ui/separator";
import { DASHBOARD_COPY } from "@/config/dashboard";
import type { CensusTotals, MainCategoryStat } from "@/types/statistics";

export interface LivestockOverviewProps {
  totals: CensusTotals;
  /** Animal groups, including any with nothing recorded. */
  mainCategories: MainCategoryStat[];
}

/**
 * District livestock total plus each animal group's share of it.
 *
 * The share bar complements the main-category chart: the chart compares sizes,
 * this states how much of the district total each group is worth.
 */
export function LivestockOverview({ totals, mainCategories }: LivestockOverviewProps) {
  const recorded = mainCategories.filter((group) => group.count > 0);
  const denominator = totals.livestockCount;

  return (
    <div className="flex flex-col gap-4">
      <LivestockSummary
        totalCount={totals.livestockCount}
        answerCount={totals.answerCount}
        mainCategoryCount={recorded.length}
      />

      <Separator />

      <ul className="flex flex-col gap-3">
        {recorded.map((group) => {
          const share = denominator === 0 ? 0 : (group.count / denominator) * 100;

          return (
            <li key={group.mainCategoryId} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="truncate text-sm">{group.mainCategoryName}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {group.mainCategoryId}
                  </span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <CountDisplay count={group.count} />
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {share.toFixed(1)}%
                  </span>
                </span>
              </div>

              <div
                role="presentation"
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${share}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        {DASHBOARD_COPY.livestockShareNote.replace("{total}", String(denominator))}
      </p>
    </div>
  );
}
