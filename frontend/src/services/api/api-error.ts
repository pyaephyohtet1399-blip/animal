const FALLBACK = "Failed to load";

/**
 * Human-readable message for an RTK Query error.
 *
 * The backend puts its message under `error.message`, `apiFetch`-style
 * `ApiError`s are plain strings, and `fetch` failures arrive as
 * `FETCH_ERROR` — each is reduced to the one line the error banners show.
 */
export function apiErrorMessage(error: unknown, fallback = FALLBACK): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const shaped = error as {
    status?: number | string;
    data?: unknown;
    error?: unknown;
    message?: unknown;
  };

  if (shaped.data && typeof shaped.data === "object") {
    const body = shaped.data as { error?: { message?: unknown }; message?: unknown };
    if (typeof body.error?.message === "string" && body.error.message) {
      return body.error.message;
    }
    if (typeof body.message === "string" && body.message) {
      return body.message;
    }
  }

  if (shaped.status === "FETCH_ERROR") {
    return "Network error — could not reach the server.";
  }

  if (shaped.status === "CUSTOM_ERROR") {
    if (typeof shaped.error === "string" && shaped.error) {
      return shaped.error;
    }
    if (typeof shaped.message === "string" && shaped.message) {
      return shaped.message;
    }
  }

  if (typeof shaped.data === "string" && shaped.data) {
    return shaped.data;
  }

  return fallback;
}
