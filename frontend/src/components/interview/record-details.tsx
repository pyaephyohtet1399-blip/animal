"use client";

import { useState, type ReactNode } from "react";

import {
  InterviewEditForm,
  type InterviewEditFormProps,
} from "@/components/interview/interview-edit-form";
import { InterviewDetails } from "@/components/interview/interview-details";
import { StatePanel } from "@/components/shared/state-panel";
import { Button } from "@/components/ui/button";
import { INTERVIEW_COPY } from "@/config ori/interview";
import type { ApiSurveyDetail, UpdateSurveyPayload } from "@/lib/repositories/livestock";
import { apiErrorMessage } from "@/services/api/api-error";
import {
  censusApi,
  useGetCategoriesQuery,
  useUpdateSurveyMutation,
} from "@/services/api/censusApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { InterviewInfo } from "@/types/census";
import type { LivestockCensus } from "@/types/livestock";

export interface RecordDetailsProps {
  interview: InterviewInfo;
  /** The household's livestock census, already resolved by the data layer. */
  census: LivestockCensus;
}

/**
 * The detail panel's two modes: read-only for everyone, editable once a
 * township or district officer asks for it.
 *
 * The form's rows come from `GET /surveys/:surveyId` — the same endpoint the
 * save rewrites — fetched with `forceRefetch` when Edit is pressed. A cached
 * answer could be the pre-save row (RTK serves it while revalidating), and a
 * form built from that would write yesterday's values back. Saving invalidates
 * the survey, so the panel behind this component and the table under it
 * refetches the fresh row on its own.
 */
export function RecordDetails({ interview, census }: RecordDetailsProps) {
  const dispatch = useAppDispatch();
  const role = useAppSelector((state) => state.auth.role);
  const canEdit = role === "township" || role === "district";

  const [isEditing, setIsEditing] = useState(false);
  const [detail, setDetail] = useState<ApiSurveyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const categoriesQuery = useGetCategoriesQuery();
  const [save, { isLoading: isSaving }] = useUpdateSurveyMutation();

  async function loadDetail() {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const result = await dispatch(
        censusApi.endpoints.getSurveyDetail.initiate(interview.p_Id, {
          subscribe: false,
          forceRefetch: true,
        }),
      );
      if ("data" in result && result.data) {
        setDetail(result.data);
      } else {
        const failure = "error" in result ? result.error : null;
        setDetailError(apiErrorMessage(failure, INTERVIEW_COPY.formErrors.saveFailed));
      }
    } catch (error) {
      setDetailError(apiErrorMessage(error, INTERVIEW_COPY.formErrors.saveFailed));
    } finally {
      setDetailLoading(false);
    }
  }

  function startEdit() {
    setSaveError(null);
    setIsEditing(true);
    void loadDetail();
  }

  async function handleSave(payload: UpdateSurveyPayload) {
    setSaveError(null);
    try {
      await save({ surveyId: interview.p_Id, payload }).unwrap();
      setIsEditing(false);
      setDetail(null);
    } catch (error) {
      setSaveError(apiErrorMessage(error, INTERVIEW_COPY.formErrors.saveFailed));
    }
  }

  function cancel() {
    setSaveError(null);
    setIsEditing(false);
    setDetail(null);
  }

  if (!canEdit || !isEditing) {
    return (
      <div className="flex flex-col gap-4">
        {canEdit ? (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={startEdit}>
              {INTERVIEW_COPY.editButton}
            </Button>
          </div>
        ) : null}
        <InterviewDetails interview={interview} census={census} />
      </div>
    );
  }

  let content: ReactNode;
  if (detailLoading) {
    content = <p className="text-sm text-muted-foreground">{INTERVIEW_COPY.loadingDetail}</p>;
  } else if (detailError || !detail) {
    content = (
      <StatePanel
        tone="error"
        title={INTERVIEW_COPY.formErrors.saveFailed}
        description={detailError ?? apiErrorMessage(null)}
        onRetry={() => void loadDetail()}
      />
    );
  } else {
    const formProps: InterviewEditFormProps = {
      interview,
      detail,
      categories: categoriesQuery.data ?? [],
      isSaving,
      error: saveError,
      onSave: handleSave,
      onCancel: cancel,
    };
    content = <InterviewEditForm {...formProps} />;
  }

  return <div className="flex flex-col gap-4">{content}</div>;
}
