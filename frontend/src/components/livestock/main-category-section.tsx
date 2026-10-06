import { LivestockTable } from "@/components/livestock/livestock-table";
import { LIVESTOCK_COPY } from "@/config/livestock";
import type { LivestockAnswer } from "@/types/livestock";

export interface MainCategorySectionProps {
  mainCategoryId: string;
  mainCategoryName: string;
  answers: LivestockAnswer[];
}

/**
 * One `main_category` group and the `category` rows inside it.
 *
 * The group total is the sum of the counts in this section only, so the section
 * figures add up to the interview total shown above them.
 */
export function MainCategorySection({
  mainCategoryId,
  mainCategoryName,
  answers,
}: MainCategorySectionProps) {
  const total = answers.reduce((sum, answer) => sum + answer.count, 0);

  return (
    <section className="flex flex-col gap-2">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <h4 className="truncate text-sm font-semibold tracking-tight">
            {mainCategoryName}
          </h4>
          <span className="font-mono text-xs text-muted-foreground">
            {mainCategoryId}
          </span>
        </div>

        <p className="text-xs text-muted-foreground tabular-nums">
          {answers.length}{" "}
          {answers.length === 1
            ? LIVESTOCK_COPY.groupHeadingSingular
            : LIVESTOCK_COPY.groupHeadingPlural}{" "}
          &middot; {LIVESTOCK_COPY.groupTotal} {total}
        </p>
      </header>

      <div className="rounded-lg border border-border">
        <LivestockTable answers={answers} showMainCategory={false} />
      </div>
    </section>
  );
}
