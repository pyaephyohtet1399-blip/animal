import { TriangleAlert } from "lucide-react";

import { LivestockSummary } from "@/components/livestock/livestock-summary";
import { MainCategorySection } from "@/components/livestock/main-category-section";
import { StatePanel } from "@/components/shared/state-panel";
import { LIVESTOCK_COPY } from "@/config ori/livestock";
import type { LivestockCensus } from "@/types/livestock";

export interface LivestockSectionProps {
  census: LivestockCensus;
}

/**
 * The livestock census of one household: total first, then one section per
 * `main_category` with the `category` rows inside it.
 *
 * Takes a resolved census, so the same section can present mock data today and
 * API data in the backend phase without changing.
 */
export function LivestockSection({ census }: LivestockSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <header>
        <h3 className="text-sm font-semibold tracking-tight">
          {LIVESTOCK_COPY.sectionTitle}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {LIVESTOCK_COPY.sectionDescription}
        </p>
      </header>

      {census.groups.length === 0 ? (
        <StatePanel
          tone="empty"
          title={LIVESTOCK_COPY.emptyTitle}
          description={LIVESTOCK_COPY.emptyDescription}
          className="rounded-lg border border-border px-4 py-8"
        />
      ) : (
        <>
          <LivestockSummary
            totalCount={census.totalCount}
            answerCount={census.answerCount}
            mainCategoryCount={census.groups.length}
          />

          {census.unresolvedCount > 0 ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning"
            >
              <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
              <span>
                {census.unresolvedCount} {LIVESTOCK_COPY.unresolvedWarning}
              </span>
            </p>
          ) : null}

          {census.groups.map((group) => (
            <MainCategorySection
              key={group.mainCategoryId}
              mainCategoryId={group.mainCategoryId}
              mainCategoryName={group.mainCategoryName}
              answers={group.answers}
            />
          ))}
        </>
      )}
    </section>
  );
}
