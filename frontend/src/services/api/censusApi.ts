import { createApi } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError, FetchBaseQueryMeta, QueryReturnValue } from "@reduxjs/toolkit/query";
import { baseQueryWithReauth } from "./baseApi";
import { assembleCensusDataset } from "@/lib/repositories/census";
import {
  buildCategories,
  CATEGORY_TYPES,
  getMainCategories,
  type ApiCategory,
} from "@/lib/repositories/category";
import {
  MAX_PAGES,
  PAGE_SIZE,
  selectInterviewsByWardVillage,
  surveyToInterview,
  type SurveyPage,
} from "@/lib/repositories/interview";
import {
  buildCensus,
  type ApiSurveyDetail,
  type UpdateSurveyPayload,
} from "@/lib/repositories/livestock";
import { parseTownship, type ApiTownship } from "@/lib/repositories/township";
import { parseTownVillage, type ApiTownVillage } from "@/lib/repositories/town-village";
import { parseWardVillage, type ApiWardVillage } from "@/lib/repositories/ward-village";
import { compareNames } from "@/lib/search";
import type { Category, InterviewInfo, Township, TownVillage, WardVillage } from "@/types/census";
import type { CensusDataset } from "@/types/census-records";
import type { LivestockCensus } from "@/types/livestock";

/**
 * Read-side API for the census, cached with RTK Query.
 *
 * Every screen — home, explorer, village detail, dashboard, census and
 * reports — pulls from these endpoints instead of calling `apiFetch` in an
 * effect, so navigating between pages reuses the cache for
 * `keepUnusedDataFor` seconds instead of refetching. Endpoints provide tags
 * and `getCensusDataset` composes the small ones, so one source of truth is
 * fetched once and shared by all consumers.
 */
type QueryFnError = FetchBaseQueryError;

/** Normalize anything a nested query throws into a `queryFn` error value. */
function asQueryFnError(error: unknown): QueryFnError {
  if (error && typeof error === "object" && "status" in error) {
    return error as FetchBaseQueryError;
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof (error as { message?: unknown } | null)?.message === "string"
          ? (error as { message: string }).message
          : "Failed to load";
  return { status: "CUSTOM_ERROR", error: message };
}

export const censusApi = createApi({
  reducerPath: "censusApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Locations", "Categories", "Surveys", "Census"],
  /** Cached five minutes past the last subscriber — long enough to page around. */
  keepUnusedDataFor: 300,
  endpoints: (build) => ({
    getTownships: build.query<Township[], void>({
      query: () => "locations/townships",
      // Alphabetical from the moment they land, so every column, chain and
      // dropdown downstream inherits the same order without re-sorting.
      transformResponse: (response: { data: ApiTownship[] }) =>
        response.data
          .map(parseTownship)
          .sort((a, b) => compareNames(a.tspName, b.tspName)),
      providesTags: ["Locations"],
    }),

    getTownVillages: build.query<TownVillage[], void>({
      query: () => "locations/townvgs",
      transformResponse: (response: { data: ApiTownVillage[] }) =>
        response.data
          .map(parseTownVillage)
          .sort((a, b) => compareNames(a.tvgName, b.tvgName)),
      providesTags: ["Locations"],
    }),

    getWardVillages: build.query<WardVillage[], void>({
      query: () => "locations/wardvillages",
      transformResponse: (response: { data: ApiWardVillage[] }) =>
        response.data
          .map(parseWardVillage)
          .sort((a, b) => compareNames(a.wvName, b.wvName)),
      providesTags: ["Locations"],
    }),

    getCategories: build.query<Category[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        const responses = await Promise.all(
          CATEGORY_TYPES.map((type) => baseQuery({ url: `categories/${type}` })),
        );
        const failed = responses.find((response) => response.error !== undefined);
        if (failed?.error) {
          return { error: failed.error };
        }
        return {
          data: buildCategories(
            responses.map(
              (response) =>
                (response.data as { data: ApiCategory[] } | undefined) ?? { data: [] },
            ),
          ),
        };
      },
      providesTags: ["Categories"],
    }),

    getInterviews: build.query<InterviewInfo[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        const first = await baseQuery({
          url: `surveys?page=1&per_page=${PAGE_SIZE}`,
        });
        if (first.error) {
          return { error: first.error };
        }
        const firstPage = first.data as SurveyPage | undefined;
        const rows = [...(firstPage?.data ?? [])];
        const totalPages = Math.min(firstPage?.meta?.total_pages ?? 1, MAX_PAGES);
        for (let page = 2; page <= totalPages; page += 1) {
          const next = await baseQuery({
            url: `surveys?page=${page}&per_page=${PAGE_SIZE}`,
          });
          if (next.error) {
            return { error: next.error };
          }
          rows.push(...((next.data as SurveyPage | undefined)?.data ?? []));
        }
        return { data: rows.map(surveyToInterview) };
      },
      providesTags: ["Surveys"],
    }),

    getSurveyDetail: build.query<ApiSurveyDetail, number>({
      query: (surveyId) => `surveys/${surveyId}`,
      transformResponse: (response: { data: ApiSurveyDetail }) => response.data,
      providesTags: ["Surveys"],
    }),

    updateSurvey: build.mutation<
      { surveyId: number },
      { surveyId: number; payload: UpdateSurveyPayload }
    >({
      query: ({ surveyId, payload }) => ({
        url: `surveys/${surveyId}`,
        method: "PUT",
        body: payload,
      }),
      // Every read of the survey — list, detail, village bundle, dataset —
      // rebuilds from the saved row, so the open panel and the table agree.
      invalidatesTags: ["Surveys", "Census"],
    }),

    getVillageLivestock: build.query<Record<string, LivestockCensus>, string>({
      async queryFn(
        wvCode,
        { dispatch },
      ): Promise<QueryReturnValue<Record<string, LivestockCensus>, QueryFnError, FetchBaseQueryMeta>> {
        try {
          const [interviews, categories] = await Promise.all([
            dispatch(censusApi.endpoints.getInterviews.initiate()).unwrap(),
            dispatch(censusApi.endpoints.getCategories.initiate()).unwrap(),
          ]);
          const villageInterviews = selectInterviewsByWardVillage(interviews, wvCode);
          const details = await Promise.all(
            villageInterviews.map((interview) =>
              dispatch(censusApi.endpoints.getSurveyDetail.initiate(interview.p_Id)).unwrap(),
            ),
          );
          const mainCategories = getMainCategories();
          const censusById: Record<string, LivestockCensus> = {};
          details.forEach((detail, index) => {
            const interview = villageInterviews[index];
            if (interview) {
              censusById[String(interview.p_Id)] = buildCensus(detail, categories, mainCategories);
            }
          });
          return { data: censusById };
        } catch (error) {
          return { error: asQueryFnError(error) };
        }
      },
      providesTags: ["Surveys"],
    }),

    getCensusDataset: build.query<CensusDataset, void>({
      async queryFn(
        _arg,
        { dispatch },
      ): Promise<QueryReturnValue<CensusDataset, QueryFnError, FetchBaseQueryMeta>> {
        try {
          const [townships, townVillages, wardVillages, interviews, categories] =
            await Promise.all([
              dispatch(censusApi.endpoints.getTownships.initiate()).unwrap(),
              dispatch(censusApi.endpoints.getTownVillages.initiate()).unwrap(),
              dispatch(censusApi.endpoints.getWardVillages.initiate()).unwrap(),
              dispatch(censusApi.endpoints.getInterviews.initiate()).unwrap(),
              dispatch(censusApi.endpoints.getCategories.initiate()).unwrap(),
            ]);

          const details = await Promise.all(
            interviews.map((interview) =>
              dispatch(censusApi.endpoints.getSurveyDetail.initiate(interview.p_Id)).unwrap(),
            ),
          );

          const mainCategories = getMainCategories();
          const censusById: Record<string, LivestockCensus> = {};
          details.forEach((detail, index) => {
            const interview = interviews[index];
            if (interview) {
              censusById[String(interview.p_Id)] = buildCensus(detail, categories, mainCategories);
            }
          });

          return {
            data: assembleCensusDataset({
              townships,
              townVillages,
              wardVillages,
              interviews,
              censusById,
              categories,
              mainCategories,
            }),
          };
        } catch (error) {
          return { error: asQueryFnError(error) };
        }
      },
      providesTags: ["Census"],
    }),
  }),
});

const {
  useGetTownshipsQuery,
  useGetTownVillagesQuery,
  useGetWardVillagesQuery,
  useGetInterviewsQuery,
  useGetVillageLivestockQuery,
  useGetCensusDatasetQuery,
  useGetCategoriesQuery,
  useGetSurveyDetailQuery,
  useUpdateSurveyMutation,
} = censusApi;

export {
  useGetTownshipsQuery,
  useGetTownVillagesQuery,
  useGetWardVillagesQuery,
  useGetInterviewsQuery,
  useGetVillageLivestockQuery,
  useGetCensusDatasetQuery,
  useGetCategoriesQuery,
  useGetSurveyDetailQuery,
  useUpdateSurveyMutation,
};
