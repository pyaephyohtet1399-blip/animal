import {
  CardSkeleton,
  ColumnSkeleton,
  LoadingShell,
  PageHeaderSkeleton,
} from "@/components/shared/loading-skeleton";

/**
 * Mirrors the village detail layout — a summary card over the interview table —
 * so a slow load shifts nothing on screen.
 */
export default function VillageDetailLoading() {
  return (
    <LoadingShell label="Loading village">
      <PageHeaderSkeleton />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 xl:col-span-2">
          <ColumnSkeleton bodyHeight="h-24" />
        </div>
        <CardSkeleton titleWidth="w-28" bodyHeight="h-16" />
      </div>

      <CardSkeleton titleWidth="w-44" bodyHeight="h-40" />
    </LoadingShell>
  );
}