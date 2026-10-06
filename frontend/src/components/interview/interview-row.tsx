"use client";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { INTERVIEW_COLUMNS } from "@/config/interview";
import { cn } from "@/lib/cn";
import type { InterviewInfo } from "@/types/census";

export interface InterviewRowProps {
  interview: InterviewInfo;
  onOpen: (p_Id: number) => void;
}

/**
 * One household interview.
 *
 * Cells are generated from `INTERVIEW_COLUMNS` so a column can never be added
 * to the header without also appearing here. Values are rendered exactly as
 * they are stored — the source uses free text for education and gender, and no
 * vocabulary is imposed on it.
 */
export function InterviewRow({ interview, onOpen }: InterviewRowProps) {
  return (
    <TableRow>
      {INTERVIEW_COLUMNS.map((column) => (
        <TableCell
          key={column.column}
          className={cn(
            column.align === "right" && "text-right tabular-nums",
            column.mono && "font-mono text-xs",
            column.emphasize && "font-medium",
          )}
        >
          {interview[column.column]}
        </TableCell>
      ))}

      <TableCell className="text-right">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpen(interview.p_Id)}
          aria-label={`Open interview details for ${interview.h_name}`}
        >
          Details
        </Button>
      </TableCell>
    </TableRow>
  );
}
