"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EXPLORER_COPY } from "@/config ori/explorer";
import { buildExplorerHref, isScoped, stepUp } from "@/lib/explorer";
import { EMPTY_SELECTION, type ExplorerSelection, type LocationNode } from "@/types/explorer";

export interface ExplorerControlsProps {
  selection: ExplorerSelection;
  township: LocationNode | null;
  townVillage: LocationNode | null;
  wardVillage: LocationNode | null;
  /** Explorer URL for the current selection; guards redundant navigation. */
  currentHref: string;
}

/**
 * Scope bar above the explorer columns.
 *
 * Says what the columns are currently limited to, and offers the two ways out:
 * step back one level, or drop the selection entirely. Both are ordinary links
 * in spirit — they change the same URL parameters that clicking a row does.
 */
export function ExplorerControls({
  selection,
  township,
  townVillage,
  wardVillage,
  currentHref,
}: ExplorerControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const scoped = isScoped(selection);

  const scopeValue = wardVillage?.name ?? townVillage?.name ?? township?.name ?? null;
  const scopeLabel = wardVillage
    ? EXPLORER_COPY.scopeWardVillage
    : townVillage
      ? EXPLORER_COPY.scopeTownVillage
      : township
        ? EXPLORER_COPY.scopeTownship
        : EXPLORER_COPY.scopeAll;

  function navigate(next: ExplorerSelection) {
    const href = buildExplorerHref(next);
    if (href === currentHref) {
      return;
    }
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return (
    <div
      aria-busy={isPending}
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <span className="text-xs text-muted-foreground">{scopeLabel}</span>
      {scopeValue ? (
        <Badge className="max-w-[16rem] truncate font-normal">{scopeValue}</Badge>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        disabled={!scoped}
        title={EXPLORER_COPY.backOneLevelHint}
        onClick={() => navigate(stepUp(selection))}
      >
        <ArrowLeft aria-hidden />
        {EXPLORER_COPY.backOneLevel}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={!scoped}
        title={EXPLORER_COPY.showAllHint}
        onClick={() => navigate(EMPTY_SELECTION)}
      >
        <RotateCcw aria-hidden />
        {EXPLORER_COPY.showAll}
      </Button>
    </div>
  );
}
