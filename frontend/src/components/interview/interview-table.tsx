"use client";

import { useMemo, useState } from "react";

import { buildCensusColumns } from "@/components/census/census-columns";
import { RecordDetails } from "@/components/interview/record-details";
import { StatePanel } from "@/components/shared/state-panel";
import { DataTable } from "@/components/table/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailPanel } from "@/components/ui/detail-panel";
import { INTERVIEW_COPY } from "@/config ori/interview";
import { sortCensusRecords } from "@/lib/census";
import type { InterviewInfo } from "@/types/census";
import type { PlaceRef } from "@/types/explorer";
import type { CensusRecord, CensusSortKey } from "@/types/census-records";
import { EMPTY_LIVESTOCK_CENSUS, type LivestockCensus } from "@/types/livestock";
import type { SortState } from "@/types/ui";

export interface InterviewTableProps {
  /** Interviews already filtered to this village. */
  interviews: InterviewInfo[];
  /** Place of the village this table belongs to; the same for every row. */
  village: PlaceRef;
  tract: PlaceRef;
  township: PlaceRef;
  /** Livestock census per interview, keyed by `p_Id`. */
  livestockByInterview: Record<string, LivestockCensus>;
}

/**
 * Household interviews for one village, shown as the census records table.
 *
 * Every row carries the same place triple, so the respondent, township, tract
 * and village columns describe the record the same way the records page does —
 * one column list, one Details panel, one edit path for both screens. Sorting
 * stays local: the rows are already scoped to this village, so a URL round-trip
 * would buy nothing.
 */
export function InterviewTable({
  interviews,
  village,
  tract,
  township,
  livestockByInterview,
}: InterviewTableProps) {
  const [openInterviewId, setOpenInterviewId] = useState<number | null>(null);
  const [sort, setSort] = useState<SortState<CensusSortKey>>({
    key: "ans_date",
    direction: "desc",
  });

  const records = useMemo<CensusRecord[]>(
    () =>
      interviews.map((interview) => {
        const census = livestockByInterview[String(interview.p_Id)] ?? EMPTY_LIVESTOCK_CENSUS;
        return {
          interview,
          township,
          tract,
          village,
          livestockCount: census.totalCount,
          answerCount: census.answerCount,
          mainCategoryIds: [...new Set(census.groups.map((group) => group.mainCategoryId))],
          categoryIds: [
            ...new Set(census.groups.flatMap((group) => group.answers.map((a) => a.categoryId))),
          ],
          census,
        };
      }),
    [interviews, village, tract, township, livestockByInterview],
  );

  const sorted = useMemo(() => sortCensusRecords(records, sort), [records, sort]);

  const openRecord =
    openInterviewId === null
      ? null
      : (records.find((record) => record.interview.p_Id === openInterviewId) ?? null);

  const columns = buildCensusColumns({
    onOpen: (record) => setOpenInterviewId(record.interview.p_Id),
  });

  function handleSortChange(key: string) {
    const sameColumn = sort.key === key;
    setSort({
      key: key as CensusSortKey,
      direction: sameColumn && sort.direction === "asc" ? "desc" : "asc",
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{INTERVIEW_COPY.sectionTitle}</CardTitle>
          <CardDescription>{INTERVIEW_COPY.sectionDescription}</CardDescription>
        </CardHeader>

        <CardContent className="px-0 py-0">
          <DataTable
            caption={`${interviews.length} ${
              interviews.length === 1 ? "record" : "records"
            } for ${village.name}`}
            columns={columns}
            rows={sorted}
            rowKey={(row) => row.interview.p_Id}
            sort={sort}
            onSortChange={handleSortChange}
            onRowClick={(row) => setOpenInterviewId(row.interview.p_Id)}
            emptyState={
              <StatePanel
                tone="empty"
                title={INTERVIEW_COPY.emptyTitle}
                description={`No household interview records are stored for ${village.name}.`}
              />
            }
          />
        </CardContent>
      </Card>

      <DetailPanel
        isOpen={openRecord !== null}
        onClose={() => setOpenInterviewId(null)}
        title={INTERVIEW_COPY.detailsTitle}
        description={openRecord ? openRecord.interview.h_name : village.name}
        size="lg"
      >
        {openRecord ? (
          <RecordDetails interview={openRecord.interview} census={openRecord.census} />
        ) : null}
      </DetailPanel>
    </>
  );
}
