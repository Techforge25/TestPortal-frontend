const ENV_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

const LOCAL_DEV_FALLBACK =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "";

export const API_BASE = (ENV_API_BASE || LOCAL_DEV_FALLBACK).replace(/\/$/, "");

export type ApiRequestOptions = {
  token?: string;
  headers?: Record<string, string>;
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  cache?: RequestCache;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!API_BASE) {
    throw new Error(
      "API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL in frontend environment."
    );
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    cache: options.cache ?? "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json().catch(() => ({}))) as { message?: string } & T;
  if (!response.ok) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}
