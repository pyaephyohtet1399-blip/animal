import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseApi";
import { setApiTokens, clearApiTokens } from "@/lib/api-client";
import type { LoginResponse, ChangePasswordRequest, ResetPasswordRequest } from "@/types/auth";
import type { JwtClaims } from "@/types/auth";
import { setCredentials, logout, setLoading, setError, clearMustChangePassword } from "@/store/slices/authSlice";

const parseJwt = (token: string): JwtClaims | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return {
      userId: decoded.userId ?? decoded.sub ?? "",
      loginCode: decoded.loginCode ?? "",
      role: decoded.role ?? "",
      districtCode: decoded.districtCode ?? "",
      tspCode: decoded.tspCode ?? "",
      tvgCode: decoded.tvgCode ?? "",
      wvCode: decoded.wvCode ?? "",
      mustChangePassword: decoded.mustChangePassword ?? false,
    };
  } catch {
    return null;
  }
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth"],
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { loginCode: string; password: string }>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: LoginResponse }) => response.data,
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
          const result = await queryFulfilled;
          const claims = parseJwt(result.data.accessToken);
          if (claims) {
            setApiTokens(result.data.accessToken, result.data.refreshToken);
            dispatch(
              setCredentials({
                accessToken: result.data.accessToken,
                refreshToken: result.data.refreshToken,
                user: claims,
              }),
            );
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Login failed. Please try again.";
          dispatch(setError(message));
        }
      },
    }),
    refresh: build.mutation<{ accessToken: string }, { refreshToken: string }>({
      query: (body) => ({
        url: "auth/refresh",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: { accessToken: string } }) => response.data,
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          const claims = parseJwt(result.data.accessToken);
          if (claims) {
            setApiTokens(result.data.accessToken, _args.refreshToken);
            dispatch(
              setCredentials({
                accessToken: result.data.accessToken,
                refreshToken: _args.refreshToken,
                user: claims,
              }),
            );
          }
        } catch {
          clearApiTokens();
          dispatch(logout());
        }
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          clearApiTokens();
          dispatch(logout());
        }
      },
    }),
    changePassword: build.mutation<void, ChangePasswordRequest>({
      query: (body) => ({
        url: "auth/change-password",
        method: "POST",
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
          await queryFulfilled;
          dispatch(clearMustChangePassword());
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to change password. Please try again.";
          dispatch(setError(message));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    resetPassword: build.mutation<void, ResetPasswordRequest & { requesterRole: string }>({
      query: (body) => ({
        url: "auth/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

const { useLoginMutation, useRefreshMutation, useLogoutMutation, useChangePasswordMutation, useResetPasswordMutation } = authApi;
export { useLoginMutation, useRefreshMutation, useLogoutMutation, useChangePasswordMutation, useResetPasswordMutation };
