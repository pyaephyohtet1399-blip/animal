"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ExplorerColumn } from "@/components/explorer/explorer-column";
import { ExplorerLayout } from "@/components/explorer/explorer-layout";
import { LocationDetails } from "@/components/explorer/location-details";
import { LocationList } from "@/components/explorer/location-list";
import { StatePanel } from "@/components/shared/state-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { EXPLORER_COPY, EXPLORER_LEVEL_COPY } from "@/config ori/explorer";
import { buildVillageHref, filterLocations } from "@/lib/explorer";
import { buildExplorerChain } from "@/lib/repositories/explorer";
import { apiErrorMessage } from "@/services/api/api-error";
import {
  useGetTownVillagesQuery,
  useGetTownshipsQuery,
  useGetWardVillagesQuery,
} from "@/services/api/censusApi";
import type { LocationNode } from "@/types/explorer";

export interface CensusLocationSearchProps {
  /** Selected township, from the census URL (`tsp`). */
  townshipCode: string | null;
  /** Selected town / village tract, from the census URL (`tvg`). */
  tractCode: string | null;
  /** Selected ward / village, from the census URL (`wv`). */
  villageCode: string | null;
  /**
   * Applies a location change to the census query. The caller resets paging and
   * pushes the new URL, so the columns and the records table always agree.
   */
  onChange: (overrides: {
    townshipCode?: string | null;
    tractCode?: string | null;
    villageCode?: string | null;
  }) => void;
  /** True while a selection change is being resolved; dims the columns. */
  isPending?: boolean;
}

/**
 * The explorer's three location columns, reused as the search control above the
 * census records table.
 *
 * Selection lives in the census URL (`tsp`/`tvg`/`wv` — the same parameter
 * names the explorer itself uses), so picking a row here narrows the records
 * below it, and clicking the selected row again clears that level and every
 * level beneath it. Each column owns only its search text, and each search
 * remembers the parent scope it was typed in so it resets when that scope
 * changes, exactly like the explorer.
 */
export function CensusLocationSearch({
  townshipCode,
  tractCode,
  villageCode,
  onChange,
  isPending = false,
}: CensusLocationSearchProps) {
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
    return buildExplorerChain(
      { townshipCode, townVillageCode: tractCode, wardVillageCode: villageCode },
      townships,
      townVillages,
      wardVillages,
    );
  }, [townshipCode, tractCode, villageCode, townships, townVillages, wardVillages]);

  const townshipScope = townshipCode ?? "";
  const tractScope = tractCode ?? "";

  const [townshipQuery, setTownshipQuery] = useState("");
  const [tractQuery, setTractQuery] = useState({ scope: townshipScope, value: "" });
  const [villageQuery, setVillageQuery] = useState({ scope: tractScope, value: "" });

  const activeTractQuery = tractQuery.scope === townshipScope ? tractQuery.value : "";
  const activeVillageQuery = villageQuery.scope === tractScope ? villageQuery.value : "";

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        {error}
      </div>
    );
  }

  if (!chain) {
    return <div className="h-72 animate-pulse rounded-lg bg-muted" />;
  }

  const visibleTownships = filterLocations(chain.townships, townshipQuery);
  const visibleTownVillages = filterLocations(chain.townVillages, activeTractQuery);
  const visibleWardVillages = filterLocations(chain.wardVillages, activeVillageQuery);

  const selection = chain.selection;

  // Selecting a level narrows to it, writing the parent codes back too so the
  // URL and the checked rows describe the same branch. Clicking the row that is
  // already selected clears that level and everything below it instead — the
  // columns are the only place to undo a selection now.
  function handleSelectTownship(node: LocationNode) {
    if (node.code === townshipCode) {
      onChange({ townshipCode: null, tractCode: null, villageCode: null });
      return;
    }
    onChange({ townshipCode: node.code, tractCode: null, villageCode: null });
  }

  function handleSelectTownVillage(node: LocationNode) {
    if (node.code === tractCode) {
      onChange({ tractCode: null, villageCode: null });
      return;
    }
    onChange({
      townshipCode: node.parentCode ?? townshipCode,
      tractCode: node.code,
      villageCode: null,
    });
  }

  function handleSelectWardVillage(node: LocationNode) {
    if (node.code === villageCode) {
      onChange({ villageCode: null });
      return;
    }
    const tract =
      chain?.townVillages.find((row) => row.code === node.parentCode) ?? null;
    onChange({
      townshipCode: tract?.parentCode ?? townshipCode,
      tractCode: tract?.code ?? node.parentCode ?? tractCode,
      villageCode: node.code,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ExplorerLayout isPending={isPending}>
        <ExplorerColumn
          title={EXPLORER_LEVEL_COPY.township.title}
          titleMm={EXPLORER_LEVEL_COPY.township.titleMm}
          totalCount={chain.townships.length}
          resultCount={visibleTownships.length}
          search={{
            label: EXPLORER_LEVEL_COPY.township.searchLabel,
            placeholder: EXPLORER_LEVEL_COPY.township.searchPlaceholder,
            value: townshipQuery,
            onChange: setTownshipQuery,
          }}
          isPending={isPending}
        >
          <LocationList
            ariaLabel={EXPLORER_LEVEL_COPY.township.title}
            className="max-h-[24rem]"
            items={visibleTownships}
            totalCount={chain.townships.length}
            query={townshipQuery}
            selectedCode={selection.townshipCode}
            onSelect={handleSelectTownship}
            emptyState={
              <StatePanel tone="empty" title={EXPLORER_LEVEL_COPY.township.emptyTitle} />
            }
            noResultState={
              <NoResults
                title={EXPLORER_LEVEL_COPY.township.noResultTitle}
                query={townshipQuery}
                onClear={() => setTownshipQuery("")}
              />
            }
          />
        </ExplorerColumn>

        <ExplorerColumn
          title={EXPLORER_LEVEL_COPY.townVillage.title}
          titleMm={EXPLORER_LEVEL_COPY.townVillage.titleMm}
          totalCount={chain.townVillages.length}
          resultCount={visibleTownVillages.length}
          search={{
            label: EXPLORER_LEVEL_COPY.townVillage.searchLabel,
            placeholder: EXPLORER_LEVEL_COPY.townVillage.searchPlaceholder,
            value: activeTractQuery,
            onChange: (value) => setTractQuery({ scope: townshipScope, value }),
          }}
          isPending={isPending}
        >
          <LocationList
            ariaLabel={EXPLORER_LEVEL_COPY.townVillage.title}
            className="max-h-[24rem]"
            items={visibleTownVillages}
            totalCount={chain.townVillages.length}
            query={activeTractQuery}
            selectedCode={selection.townVillageCode}
            onSelect={handleSelectTownVillage}
            emptyState={
              <StatePanel
                tone="empty"
                title={EXPLORER_LEVEL_COPY.townVillage.emptyTitle}
                description={
                  chain.township
                    ? "The selected township has no tract records."
                    : undefined
                }
              />
            }
            noResultState={
              <NoResults
                title={EXPLORER_LEVEL_COPY.townVillage.noResultTitle}
                query={activeTractQuery}
                onClear={() => setTractQuery({ scope: townshipScope, value: "" })}
              />
            }
          />
        </ExplorerColumn>

        <ExplorerColumn
          title={EXPLORER_LEVEL_COPY.wardVillage.title}
          titleMm={EXPLORER_LEVEL_COPY.wardVillage.titleMm}
          totalCount={chain.wardVillages.length}
          resultCount={visibleWardVillages.length}
          search={{
            label: EXPLORER_LEVEL_COPY.wardVillage.searchLabel,
            placeholder: EXPLORER_LEVEL_COPY.wardVillage.searchPlaceholder,
            value: activeVillageQuery,
            onChange: (value) => setVillageQuery({ scope: tractScope, value }),
          }}
          isPending={isPending}
        >
          <LocationList
            ariaLabel={EXPLORER_LEVEL_COPY.wardVillage.title}
            className="max-h-[24rem]"
            items={visibleWardVillages}
            totalCount={chain.wardVillages.length}
            query={activeVillageQuery}
            selectedCode={selection.wardVillageCode}
            onSelect={handleSelectWardVillage}
            renderAction={(node) => (
              <Link
                href={buildVillageHref(node.code)}
                aria-label={`${EXPLORER_COPY.openVillageDetail} for ${node.name}`}
                title={EXPLORER_COPY.openVillageDetail}
                className={buttonVariants({ variant: "ghost", size: "icon" })}
              >
                <ChevronRight aria-hidden />
              </Link>
            )}
            emptyState={
              <StatePanel
                tone="empty"
                title={EXPLORER_LEVEL_COPY.wardVillage.emptyTitle}
                description={
                  chain.townVillage
                    ? "The selected tract has no ward or village records."
                    : chain.township
                      ? "The selected township has no ward or village records."
                      : undefined
                }
              />
            }
            noResultState={
              <NoResults
                title={EXPLORER_LEVEL_COPY.wardVillage.noResultTitle}
                query={activeVillageQuery}
                onClear={() => setVillageQuery({ scope: tractScope, value: "" })}
              />
            }
          />
        </ExplorerColumn>
      </ExplorerLayout>

      {chain.wardVillage ? (
        <LocationDetails
          village={chain.wardVillage}
          tract={chain.townVillage}
          township={chain.township}
          description="Ward / village selected for the records below."
          footer={null}
          action={
            <Link
              href={buildVillageHref(chain.wardVillage.code)}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <ChevronRight aria-hidden />
              {EXPLORER_COPY.openVillageDetail}
            </Link>
          }
        />
      ) : null}
    </div>
  );
}

interface NoResultsProps {
  title: string;
  query: string;
  onClear: () => void;
}

/** Search matched records that exist but none in this level. */
function NoResults({ title, query, onClear }: NoResultsProps) {
  return (
    <StatePanel
      tone="empty"
      title={title}
      description={`Nothing matches “${query.trim()}”.`}
      action={
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear search
        </Button>
      }
    />
  );
}
