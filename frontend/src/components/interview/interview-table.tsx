"use client";

import { useState } from "react";

import { InterviewDetails } from "@/components/interview/interview-details";
import { InterviewRow } from "@/components/interview/interview-row";
import { StatePanel } from "@/components/shared/state-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailPanel } from "@/components/ui/detail-panel";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INTERVIEW_COLUMNS, INTERVIEW_COPY } from "@/config/interview";
import type { InterviewInfo } from "@/types/census";
import { EMPTY_LIVESTOCK_CENSUS, type LivestockCensus } from "@/types/livestock";

export interface InterviewTableProps {
  /** Interviews already filtered to this village. */
  interviews: InterviewInfo[];
  villageName: string;
  /** Livestock census per interview, keyed by `p_Id`. */
  livestockByInterview: Record<string, LivestockCensus>;
}

/**
 * Household interviews for one village, with the selected interview opened in a
 * side panel.
 *
 * The open record is held as a `p_Id` rather than as the record itself, so the
 * panel always shows whatever the table currently holds and closing it is a
 * single state reset.
 */
export function InterviewTable({
  interviews,
  villageName,
  livestockByInterview,
}: InterviewTableProps) {
  const [openInterviewId, setOpenInterviewId] = useState<number | null>(null);

  const openInterview =
    interviews.find((interview) => interview.p_Id === openInterviewId) ?? null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{INTERVIEW_COPY.sectionTitle}</CardTitle>
          <CardDescription>{INTERVIEW_COPY.sectionDescription}</CardDescription>
        </CardHeader>

        <CardContent className="px-0 py-0">
          {interviews.length === 0 ? (
            <StatePanel
              tone="empty"
              title={INTERVIEW_COPY.emptyTitle}
              description={`No household interview records are stored for ${villageName}.`}
            />
          ) : (
            <Table>
              <TableCaption>
                {interviews.length}{" "}
                {interviews.length === 1 ? "record" : "records"} for {villageName}
              </TableCaption>

              <TableHeader>
                <TableRow>
                  {INTERVIEW_COLUMNS.map((column) => (
                    <TableHead
                      key={column.column}
                      className={column.align === "right" ? "text-right" : undefined}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {interviews.map((interview) => (
                  <InterviewRow
                    key={interview.p_Id}
                    interview={interview}
                    onOpen={setOpenInterviewId}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DetailPanel
        isOpen={openInterview !== null}
        onClose={() => setOpenInterviewId(null)}
        title={INTERVIEW_COPY.detailsTitle}
        description={openInterview ? openInterview.h_name : villageName}
        size="lg"
      >
        {openInterview ? (
          <InterviewDetails
            interview={openInterview}
            census={
              livestockByInterview[String(openInterview.p_Id)] ?? EMPTY_LIVESTOCK_CENSUS
            }
          />
        ) : null}
      </DetailPanel>
    </>
  );
}
