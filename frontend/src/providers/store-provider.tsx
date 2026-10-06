"use client";

import { Provider } from "react-redux";
import { useState } from "react";
import { makeStore } from "@/store/store";
import { setCredentials } from "@/store/slices/authSlice";
import { getApiAccessToken, getApiRefreshToken } from "@/lib/api-client";
import type { JwtClaims } from "@/types/auth";

function parseJwt(token: string): JwtClaims | null {
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
}

function initStore() {
  const store = makeStore();
  const access = getApiAccessToken();
  const refresh = getApiRefreshToken();
  if (access && refresh) {
    const claims = parseJwt(access);
    if (claims) {
      store.dispatch(setCredentials({ accessToken: access, refreshToken: refresh, user: claims }));
    }
  }
  return store;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(initStore);
  return <Provider store={store}>{children}</Provider>;
}
