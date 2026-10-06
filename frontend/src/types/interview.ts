/**
 * Columns of `interview_info` that this application presents.
 *
 * Declaring them once means the table header, the table cells and the detail
 * panel can never disagree about a column's name, and adding a field later is a
 * one-line change. Every column here exists in the source table; nothing is
 * invented.
 */

export const INTERVIEW_DETAIL_COLUMNS = [
  "h_name",
  "h_edu",
  "h_gender",
  "h_phone",
  "h_age",
  "ans_date",
] as const;

/** One of the presented `interview_info` columns. */
export type InterviewColumnKey = (typeof INTERVIEW_DETAIL_COLUMNS)[number];