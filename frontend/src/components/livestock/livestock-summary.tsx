import { CountDisplay } from "@/components/livestock/count-display";
import { LIVESTOCK_COPY } from "@/config/livestock";

export interface LivestockSummaryProps {
  /** Sum of every `answer.count` for the interview. */
  totalCount: number;
  /** Rows in `answer` for the interview. */
  answerCount: number;
  /** Main categories represented in those rows. */
  mainCategoryCount: number;
}

/**
 * Headline figures for one household's livestock.
 *
 * The total is passed in already calculated from the stored counts; this
 * component only presents it, so the same summary can be reused wherever a
 * census total is needed.
 */
export function LivestockSummary({
  totalCount,
  answerCount,
  mainCategoryCount,
}: LivestockSummaryProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {LIVESTOCK_COPY.summaryLabel}
        </span>
        <CountDisplay count={totalCount} className="text-left text-2xl" />
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground">{LIVESTOCK_COPY.summaryAnswers}</dt>
          <dd className="font-medium tabular-nums">{answerCount}</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="text-muted-foreground">{LIVESTOCK_COPY.summaryGroups}</dt>
          <dd className="font-medium tabular-nums">{mainCategoryCount}</dd>
        </div>
      </dl>
    </div>
  );
}
