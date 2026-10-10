import type { InterviewInfo } from "@/types/census";

interface ApiInterviewId {
  _id: string;
  hName: string;
  hEdu: string;
  hGender: string;
  hPhone: string;
  hAge: number;
  ansDate: string;
  tspCode: string;
  wvCode: string;
}

export interface ApiSurvey {
  _id: string;
  surveyId: number;
  interviewId: ApiInterviewId;
  villageHeadmanId: string;
  status: string;
  districtCode: string;
  tspCode: string;
  tvgCode: string;
  wvCode: string;
  syncVersion: number;
  interviewerName?: string;
  interviewerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyPage {
  data: ApiSurvey[];
  meta?: { total_pages?: number };
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function surveyToInterview(survey: ApiSurvey): InterviewInfo {
  const iv = survey.interviewId;
  return {
    p_Id: survey.surveyId,
    h_name: iv.hName,
    h_edu: iv.hEdu,
    h_gender: iv.hGender,
    h_phone: iv.hPhone,
    h_age: iv.hAge,
    ans_date: toDateOnly(iv.ansDate),
    wvCode: survey.wvCode,
    interviewer_name: survey.interviewerName ?? "",
    interviewer_phone: survey.interviewerPhone ?? "",
  };
}

export const PAGE_SIZE = 100;

/**
 * Most recently answered first, ties broken by `p_Id`.
 *
 * `ans_date` is stored as an ISO date, so it sorts correctly as text and the
 * order never depends on the order the source happens to return rows in.
 */
export function selectInterviewsByWardVillage(
  interviews: readonly InterviewInfo[],
  wvCode: string,
): InterviewInfo[] {
  return interviews
    .filter((interview) => interview.wvCode === wvCode)
    .sort((a, b) => b.ans_date.localeCompare(a.ans_date) || a.p_Id - b.p_Id);
}
