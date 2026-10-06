"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExplorerControls } from "@/components/explorer/explorer-controls";
import { ExplorerView } from "@/components/explorer/explorer-view";
import { LocationBreadcrumb } from "@/components/explorer/location-breadcrumb";
import { PageHeader } from "@/components/shared/page-header";
import { buildExplorerHref, parseExplorerSelection } from "@/lib/explorer";
import { getExplorerChain } from "@/lib/repositories/explorer";
import type { ExplorerChain } from "@/lib/repositories/explorer";

export function ExplorerContent() {
  const searchParams = useSearchParams();
  const [chain, setChain] = useState<ExplorerChain | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selection = useMemo(() => {
    const record: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      record[key] = value;
    });
    return parseExplorerSelection(record);
  }, [searchParams]);

  useEffect(() => {
    getExplorerChain(selection)
      .then(setChain)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [selection]);

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
