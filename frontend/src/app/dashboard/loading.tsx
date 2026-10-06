import {
  CardSkeleton,
  LoadingShell,
  PageHeaderSkeleton,
  StatCardsSkeleton,
} from "@/components/shared/loading-skeleton";

/** Mirrors the dashboard layout so a slow load shifts nothing on screen. */
export default function DashboardLoading() {
  return (
    <LoadingShell label="Loading dashboard">
      <PageHeaderSkeleton />

      <StatCardsSkeleton count={5} />

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <CardSkeleton key={index} titleWidth="w-44" bodyHeight="h-[260px]" />
        ))}
      </div>

      <CardSkeleton titleWidth="w-52" bodyHeight="h-[320px]" />
    </LoadingShell>
  );
}