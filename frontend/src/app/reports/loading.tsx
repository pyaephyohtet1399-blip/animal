import {
  CardSkeleton,
  LoadingShell,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/shared/loading-skeleton";

/** Mirrors the reports layout so a slow load shifts nothing on screen. */
export default function ReportsLoading() {
  return (
    <LoadingShell label="Loading reports">
      <PageHeaderSkeleton />

      <StatCardsSkeleton count={4} />

      {Array.from({ length: 5 }, (_, index) => (
        <CardSkeleton key={index} titleWidth="w-48" bodyHeight="h-48" />
      ))}
    </LoadingShell>
  );
}