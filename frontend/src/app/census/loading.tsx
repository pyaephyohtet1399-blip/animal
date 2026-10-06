import {
  FilterRowSkeleton,
  LoadingShell,
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/shared/loading-skeleton";

/** Mirrors the census records layout so a slow load shifts nothing on screen. */
export default function CensusLoading() {
  return (
    <LoadingShell label="Loading census records">
      <PageHeaderSkeleton />

      <div className="flex flex-col gap-3">
        <FilterRowSkeleton count={1} />
        <FilterRowSkeleton count={6} />
      </div>

      <TableSkeleton rows={5} />
    </LoadingShell>
  );
}