"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { InterviewTable } from "@/components/interview/interview-table";
import { VillageHeader } from "@/components/village/village-header";
import { VillageSummary } from "@/components/village/village-summary";
import { selectInterviewsByWardVillage } from "@/lib/repositories/interview";
import { findWardVillageChain } from "@/lib/repositories/explorer";
import { apiErrorMessage } from "@/services/api/api-error";
import {
  useGetInterviewsQuery,
  useGetTownVillagesQuery,
  useGetTownshipsQuery,
  useGetVillageLivestockQuery,
  useGetWardVillagesQuery,
} from "@/services/api/censusApi";

export function VillageDetailContent() {
  const params = useParams<{ wvCode: string }>();
  const wvCode = params.wvCode;

  const townshipsQuery = useGetTownshipsQuery();
  const townVillagesQuery = useGetTownVillagesQuery();
  const wardVillagesQuery = useGetWardVillagesQuery();

  const locationsReady = Boolean(
    townshipsQuery.data && townVillagesQuery.data && wardVillagesQuery.data,
  );

  const chain = useMemo(() => {
    if (!wvCode || !locationsReady) return null;
    return findWardVillageChain(
      wvCode,
      wardVillagesQuery.data ?? [],
      townVillagesQuery.data ?? [],
      townshipsQuery.data ?? [],
    );
  }, [
    wvCode,
    locationsReady,
    townshipsQuery.data,
    townVillagesQuery.data,
    wardVillagesQuery.data,
  ]);

  const ready = chain !== null;
  const interviewsQuery = useGetInterviewsQuery(undefined, { skip: !ready });
  const livestockQuery = useGetVillageLivestockQuery(wvCode ?? "", { skip: !ready });

  const interviews = useMemo(
    () => (chain ? selectInterviewsByWardVillage(interviewsQuery.data ?? [], chain.village.code) : []),
    [chain, interviewsQuery.data],
  );
  const livestock = livestockQuery.data ?? {};

  const failedQuery = [
    townshipsQuery,
    townVillagesQuery,
    wardVillagesQuery,
    ...(ready ? [interviewsQuery, livestockQuery] : []),
  ].find((query) => query.isError);
  const notFound = locationsReady && chain === null;
  const error = failedQuery
    ? apiErrorMessage(failedQuery.error)
    : notFound
      ? "Village not found"
      : null;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!locationsReady || !chain || interviewsQuery.isLoading || livestockQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <VillageHeader
        village={chain.village}
        tract={chain.tract}
        township={chain.township}
      />

      <VillageSummary
        village={chain.village}
        tract={chain.tract}
        township={chain.township}
        interviewCount={interviews.length}
      />

      <InterviewTable
        interviews={interviews}
        village={chain.village}
        tract={chain.tract}
        township={chain.township}
        livestockByInterview={livestock}
      />
    </div>
  );
}
