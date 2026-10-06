import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { setCredentials, logout } from "@/store/slices/authSlice";
import { setApiTokens, clearApiTokens } from "@/lib/api-client";
import type { JwtClaims } from "@/types/auth";

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100/api/v1";
};

const baseApiBaseQuery = fetchBaseQuery({
  baseUrl: `${getApiBaseUrl()}/`,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as { auth: { accessToken: string | null } };
    const token = state.auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
});

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

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await baseApiBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const authState = api.getState() as { auth: { refreshToken: string | null; accessToken: string | null } };

    if (!authState.auth.refreshToken) {
      clearApiTokens();
      api.dispatch(logout());
    } else if (!(api as { reauth?: boolean }).reauth) {
      (api as { reauth?: boolean }).reauth = true;

      try {
        const refreshResult = await baseApiBaseQuery(
          { url: "auth/refresh", method: "POST", body: { refreshToken: authState.auth.refreshToken } },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const payload = (refreshResult.data as { data?: { accessToken?: string; refreshToken?: string } }).data
            ?? (refreshResult.data as { accessToken?: string; refreshToken?: string });
          const newAccessToken = payload.accessToken;
          const newRefreshToken = payload.refreshToken ?? authState.auth.refreshToken;
          if (!newAccessToken) {
            clearApiTokens();
            api.dispatch(logout());
            return result;
          }

          const claims = parseJwt(newAccessToken);

          if (claims) {
            setApiTokens(newAccessToken, newRefreshToken);
            api.dispatch(
              setCredentials({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: claims,
              })
            );
          }

          return await baseApiBaseQuery(args, api, extraOptions);
        }

        clearApiTokens();
        api.dispatch(logout());
      } finally {
        (api as { reauth?: boolean }).reauth = false;
      }
    }
  }

  return result;
};
