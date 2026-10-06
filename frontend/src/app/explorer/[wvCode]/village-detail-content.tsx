"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InterviewTable } from "@/components/interview/interview-table";
import { VillageHeader } from "@/components/village/village-header";
import { VillageSummary } from "@/components/village/village-summary";
import { getWardVillageChain } from "@/lib/repositories/explorer";
import { getInterviewsByWardVillage } from "@/lib/repositories/interview";
import { getLivestockCensusForInterviews } from "@/lib/repositories/livestock";
import type { WardVillageChain } from "@/lib/repositories/explorer";
import type { InterviewInfo } from "@/types/census";
import type { LivestockCensus } from "@/types/livestock";

export function VillageDetailContent() {
  const params = useParams<{ wvCode: string }>();
  const wvCode = params.wvCode;

  const [chain, setChain] = useState<WardVillageChain | null>(null);
  const [interviews, setInterviews] = useState<InterviewInfo[]>([]);
  const [livestock, setLivestock] = useState<Record<string, LivestockCensus>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wvCode) return;
    let cancelled = false;
    getWardVillageChain(wvCode)
      .then(async (c) => {
        if (cancelled) return;
        if (!c) {
          setError("Village not found");
          return;
        }
        setChain(c);
        const ivs = await getInterviewsByWardVillage(c.village.code);
        if (cancelled) return;
        setInterviews(ivs);
        const lv = await getLivestockCensusForInterviews(ivs.map((i) => i.p_Id));
        if (cancelled) return;
        setLivestock(lv);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wvCode]);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (loading || !chain) {
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
        villageName={chain.village.name}
        livestockByInterview={livestock}
      />
    </div>
  );
}
