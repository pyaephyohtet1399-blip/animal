"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buildCensusColumns } from "@/components/census/census-columns";
import { CensusLocationSearch } from "@/components/census/census-location-search";
import { RecordDetails } from "@/components/interview/record-details";
import { StatePanel } from "@/components/shared/state-panel";
import { DataTable } from "@/components/table/data-table";
import { Pagination } from "@/components/table/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailPanel } from "@/components/ui/detail-panel";
import { CENSUS_COPY } from "@/config ori/census";
import { buildCensusHref, hasActiveFilters, CENSUS_PAGE_SIZE } from "@/lib/census";
import type {
  CensusDataset,
  CensusFilterState,
  CensusRecord,
  CensusSortKey,
} from "@/types/census-records";

export interface CensusRecordsViewProps {
  dataset: CensusDataset;
  /** Normalized query, with `page` already clamped into range. */
  state: CensusFilterState;
  /** The page of rows the server resolved for `state`. */
  rows: CensusRecord[];
  /** How many rows matched before paging. */
  matchedCount: number;
  /** 1-based index of the first row on this page, 0 when empty. */
  from: number;
  to: number;
  pageCount: number;
}

/** Everything removed by "clear all". */
const CLEAR_ALL: Partial<CensusFilterState> = {
  query: "",
  townshipCode: null,
  tractCode: null,
  villageCode: null,
  mainCategoryId: null,
  categoryId: null,
  dateFrom: null,
  dateTo: null,
  page: 1,
};

/**
 * Census records table: orchestration only.
 *
 * The component holds no records. Filtering, sorting and paging already happened
 * on the server, and every control works by changing the URL — so a filtered view
 * is shareable, the back button steps through filter changes, and swapping the
 * mock data for an endpoint means replacing one query, not this component.
 *
 * The location columns sit above in `CensusLocationSearch` and the column list
 * lives in `census-columns`; what is left here is the navigation, the row that
 * is open, and the layout. The open row is tracked by id, not by object, so a
 * save that rewrites the dataset re-renders the panel with the fresh row.
 */
export function CensusRecordsView({
  dataset,
  state,
  rows,
  matchedCount,
  from,
  to,
  pageCount,
}: CensusRecordsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openRecordId, setOpenRecordId] = useState<number | null>(null);

  /** Single entry point for every query change, so paging stays consistent. */
  function change(overrides: Partial<CensusFilterState>) {
    // Narrowing invalidates the current page offset; changing the sort or the
    // page explicitly does not.
    const narrows = Object.keys(overrides).some((key) => key !== "sort" && key !== "page");
    const next: CensusFilterState = {
      ...state,
      ...overrides,
      page: narrows && overrides.page === undefined ? 1 : (overrides.page ?? state.page),
    };

    startTransition(() => {
      router.push(buildCensusHref(next), { scroll: false });
    });
  }

  function clearAll() {
    setOpenRecordId(null);
    change(CLEAR_ALL);
  }

  function handleSortChange(key: string) {
    const sameColumn = state.sort.key === key;
    change({
      sort: {
        key: key as CensusSortKey,
        direction: sameColumn && state.sort.direction === "asc" ? "desc" : "asc",
      },
    });
  }

  const openRecord =
    openRecordId === null
      ? null
      : (dataset.records.find((record) => record.interview.p_Id === openRecordId) ?? null);
  const columns = buildCensusColumns({ onOpen: (record) => setOpenRecordId(record.interview.p_Id) });
  const hasFilters = hasActiveFilters(state);

  return (
    <div className="flex flex-col gap-4">
      <CensusLocationSearch
        townshipCode={state.townshipCode}
        tractCode={state.tractCode}
        villageCode={state.villageCode}
        onChange={(overrides) => change(overrides)}
        isPending={isPending}
      />

      <Card className="min-w-0">
        <CardContent className="px-0 py-0">
          <DataTable
            caption={`${matchedCount} of ${dataset.records.length} census records`}
            columns={columns}
            rows={rows}
            rowKey={(row) => row.interview.p_Id}
            sort={state.sort}
            onSortChange={handleSortChange}
            onRowClick={(row) => setOpenRecordId(row.interview.p_Id)}
            emptyState={
              <StatePanel
                tone="empty"
                title={hasFilters ? CENSUS_COPY.noMatchTitle : CENSUS_COPY.emptyTitle}
                description={
                  hasFilters ? CENSUS_COPY.noMatchDescription : undefined
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      {CENSUS_COPY.clearFilters}
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        </CardContent>
      </Card>

      <Pagination
        page={state.page}
        pageCount={pageCount}
        from={from}
        to={to}
        total={matchedCount}
        pageSize={CENSUS_PAGE_SIZE}
        onPageChange={(page) => change({ page })}
      />

      <DetailPanel
        isOpen={openRecord !== null}
        onClose={() => setOpenRecordId(null)}
        title={CENSUS_COPY.title}
        description={openRecord ? openRecord.interview.h_name : undefined}
        size="lg"
      >
        {openRecord ? (
          <RecordDetails interview={openRecord.interview} census={openRecord.census} />
        ) : null}
      </DetailPanel>
    </div>
  );
}
