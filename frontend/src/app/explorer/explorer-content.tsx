"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ExplorerControls } from "@/components/explorer/explorer-controls";
import { ExplorerView } from "@/components/explorer/explorer-view";
import { LocationBreadcrumb } from "@/components/explorer/location-breadcrumb";
import { PageHeader } from "@/components/shared/page-header";
import { buildExplorerHref, parseExplorerSelection } from "@/lib/explorer";
import { buildExplorerChain } from "@/lib/repositories/explorer";
import { apiErrorMessage } from "@/services/api/api-error";
import {
  useGetTownVillagesQuery,
  useGetTownshipsQuery,
  useGetWardVillagesQuery,
} from "@/services/api/censusApi";

export function ExplorerContent() {
  const searchParams = useSearchParams();

  const selection = useMemo(() => {
    const record: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    return parseExplorerSelection(record);
  }, [searchParams]);

  const townshipsQuery = useGetTownshipsQuery();
  const townVillagesQuery = useGetTownVillagesQuery();
  const wardVillagesQuery = useGetWardVillagesQuery();
  const failedQuery = [townshipsQuery, townVillagesQuery, wardVillagesQuery].find(
    (query) => query.isError,
  );
  const error = failedQuery ? apiErrorMessage(failedQuery.error) : null;

  const { data: townships } = townshipsQuery;
  const { data: townVillages } = townVillagesQuery;
  const { data: wardVillages } = wardVillagesQuery;

  const chain = useMemo(() => {
    if (!townships || !townVillages || !wardVillages) return null;
    return buildExplorerChain(selection, townships, townVillages, wardVillages);
  }, [selection, townships, townVillages, wardVillages]);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Data Explorer" subtitle="ဒေတာရှာဖွေးရန်" />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!chain) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Data Explorer" subtitle="ဒေတာရှာဖွေးရန်" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const currentHref = buildExplorerHref(chain.selection);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Explorer"
        subtitle="ဒေတာရှာဖွေးရန်"
        description="Every column starts with the whole district. Pick a township or tract to narrow the columns below it."
        breadcrumb={
          <LocationBreadcrumb
            township={chain.township}
            townVillage={chain.townVillage}
            wardVillage={chain.wardVillage}
          />
        }
        actions={
          <ExplorerControls
            selection={chain.selection}
            township={chain.township}
            townVillage={chain.townVillage}
            wardVillage={chain.wardVillage}
            currentHref={currentHref}
          />
        }
      />

      <ExplorerView
        townships={chain.townships}
        townVillages={chain.townVillages}
        wardVillages={chain.wardVillages}
        selection={chain.selection}
        township={chain.township}
        townVillage={chain.townVillage}
        wardVillage={chain.wardVillage}
        currentHref={currentHref}
      />
    </div>
  );
}
