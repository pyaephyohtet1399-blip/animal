const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100/api/v1";

const ACCESS_KEY = "ls_access_token";
const REFRESH_KEY = "ls_refresh_token";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export function setApiTokens(access: string, refresh: string): void {
  writeStorage(ACCESS_KEY, access);
  writeStorage(REFRESH_KEY, refresh);
}

export function clearApiTokens(): void {
  removeStorage(ACCESS_KEY);
  removeStorage(REFRESH_KEY);
}

export function getApiAccessToken(): string | null {
  return readStorage(ACCESS_KEY);
}

export function getApiRefreshToken(): string | null {
  return readStorage(REFRESH_KEY);
}

async function tryRefresh(): Promise<boolean> {
  const refresh = readStorage(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const body = await res.json();
    const newAccess = body?.data?.accessToken;
    if (!newAccess) return false;
    writeStorage(ACCESS_KEY, newAccess);
    const newRefresh = body?.data?.refreshToken;
    if (newRefresh) {
      writeStorage(REFRESH_KEY, newRefresh);
    }
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    const token = readStorage(ACCESS_KEY);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}/${path.replace(/^\//, "")}`, { ...init, headers });
  };

  let res = await doFetch();

  if (res.status === 401 && (await tryRefresh())) {
    res = await doFetch();
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? body?.message ?? message;
    } catch {
      /* keep status message */
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
