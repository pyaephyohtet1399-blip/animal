"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ExplorerColumn } from "@/components/explorer/explorer-column";
import { ExplorerLayout } from "@/components/explorer/explorer-layout";
import { LocationDetails } from "@/components/explorer/location-details";
import { LocationList } from "@/components/explorer/location-list";
import { StatePanel } from "@/components/shared/state-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { EXPLORER_COPY, EXPLORER_LEVEL_COPY } from "@/config/explorer";
import {
  buildExplorerHref,
  buildVillageHref,
  filterLocations,
} from "@/lib/explorer";
import type { ExplorerSelection, LocationNode } from "@/types/explorer";

export interface ExplorerViewProps {
  townships: LocationNode[];
  townVillages: LocationNode[];
  wardVillages: LocationNode[];
  /** Selection after invalid codes were dropped, so every code here is real. */
  selection: ExplorerSelection;
  /** Resolved nodes, for the details panel. */
  township: LocationNode | null;
  townVillage: LocationNode | null;
  wardVillage: LocationNode | null;
  /** Explorer URL of the current selection; guards redundant navigation. */
  currentHref: string;
}

/**
 * The three level columns plus the selected-village panel.
 *
 * All three columns are populated on arrival: with nothing selected they list
 * the whole district, and each column narrows the levels below it. The
 * selection itself lives in the URL, so this component only owns the per-level
 * search text. Each search remembers the parent scope it was typed in, which is
 * how a box resets when its scope changes without needing an effect.
 */
export function ExplorerView({
  townships,
  townVillages,
  wardVillages,
  selection,
  township,
  townVillage,
  wardVillage,
  currentHref,
}: ExplorerViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const townshipScope = selection.townshipCode ?? "";
  const tractScope = selection.townVillageCode ?? "";

  const [townshipQuery, setTownshipQuery] = useState("");
  const [tractQuery, setTractQuery] = useState({ scope: townshipScope, value: "" });
  const [villageQuery, setVillageQuery] = useState({ scope: tractScope, value: "" });

  const activeTractQuery = tractQuery.scope === townshipScope ? tractQuery.value : "";
  const activeVillageQuery = villageQuery.scope === tractScope ? villageQuery.value : "";

  const visibleTownships = useMemo(
    () => filterLocations(townships, townshipQuery),
    [townships, townshipQuery],
  );
  const visibleTownVillages = useMemo(
    () => filterLocations(townVillages, activeTractQuery),
    [townVillages, activeTractQuery],
  );
  const visibleWardVillages = useMemo(
    () => filterLocations(wardVillages, activeVillageQuery),
    [wardVillages, activeVillageQuery],
  );

  function navigate(next: ExplorerSelection) {
    const href = buildExplorerHref(next);
    if (href === currentHref) {
      return;
    }
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  // Selecting a level always narrows to it; stepping back out is the job of the
  // scope bar's "back one level" and "show all" controls.
  function handleSelectTownship(node: LocationNode) {
    navigate({ townshipCode: node.code, townVillageCode: null, wardVillageCode: null });
  }

  function handleSelectTownVillage(node: LocationNode) {
    navigate({
      townshipCode: township?.code ?? null,
      townVillageCode: node.code,
      wardVillageCode: null,
    });
  }

  function handleSelectWardVillage(node: LocationNode) {
    navigate({ ...selection, wardVillageCode: node.code });
  }

  return (
    <div className="flex flex-col gap-4">
      <ExplorerLayout isPending={isPending}>
        <ExplorerColumn
          title={EXPLORER_LEVEL_COPY.township.title}
          titleMm={EXPLORER_LEVEL_COPY.township.titleMm}
          totalCount={townships.length}
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
            className="max-h-[28rem]"
            items={visibleTownships}
            totalCount={townships.length}
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
          totalCount={townVillages.length}
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
            className="max-h-[28rem]"
            items={visibleTownVillages}
            totalCount={townVillages.length}
            query={activeTractQuery}
            selectedCode={selection.townVillageCode}
            onSelect={handleSelectTownVillage}
            emptyState={
              <StatePanel
                tone="empty"
                title={EXPLORER_LEVEL_COPY.townVillage.emptyTitle}
                description={
                  township
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
          totalCount={wardVillages.length}
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
            className="max-h-[28rem]"
            items={visibleWardVillages}
            totalCount={wardVillages.length}
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
                  townVillage
                    ? "The selected tract has no ward or village records."
                    : township
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

      <LocationDetails
        village={wardVillage}
        tract={townVillage}
        township={township}
        action={
          wardVillage ? (
            <Link
              href={buildVillageHref(wardVillage.code)}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <ChevronRight aria-hidden />
              {EXPLORER_COPY.openVillageDetail}
            </Link>
          ) : null
        }
      />
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
