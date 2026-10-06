import {
  CardSkeleton,
  ColumnSkeleton,
  LoadingShell,
  PageHeaderSkeleton,
} from "@/components/shared/loading-skeleton";

/**
 * Mirrors the explorer layout — three columns over a village summary — so a slow
 * load shifts nothing on screen.
 */
export default function ExplorerLoading() {
  return (
    <LoadingShell label="Loading explorer">
      <PageHeaderSkeleton />

      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <ColumnSkeleton key={index} />
        ))}
      </div>

      <CardSkeleton titleWidth="w-32" bodyHeight="h-24" />
    </LoadingShell>
  );
}