import type { InterviewColumnKey } from "@/types/interview";

export interface InterviewColumn {
  /** Source column in `interview_info`. */
  column: InterviewColumnKey;
  label: string;
  align?: "left" | "right";
  /** Renders the value in the monospaced face used for codes and dates. */
  mono?: boolean;
  /** Renders the value as the row's primary label. */
  emphasize?: boolean;
}

/**
 * Column order for the household table, in the order it is presented. The same
 * list drives the table header, the cells and the detail panel.
 */
export const INTERVIEW_COLUMNS: InterviewColumn[] = [
  { column: "h_name", label: "Respondent / Household Name", emphasize: true },
  { column: "h_edu", label: "Education" },
  { column: "h_gender", label: "Gender" },
  { column: "h_phone", label: "Phone", mono: true },
  { column: "h_age", label: "Age", align: "right" },
  { column: "ans_date", label: "Answer Date", mono: true },
];

export const INTERVIEW_COPY = {
  sectionTitle: "Household interviews",
  sectionDescription:
    "Household interview records stored against this ward / village.",
  tableCaption: "Household interview records",
  emptyTitle: "No interview records",
  detailsTitle: "Household interview",
} as const;
