import type { ApiResponse } from "@daily-pulse/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Typed fetch client for the Express API. Server Components use this. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} on ${path}`);
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error?.message ?? "API error");
  }
  return json.data;
}

/**
 * Never throws: returns `fallback` when the API is down, slow, or returns
 * an error. Every public page uses this so `next build` passes with no
 * running API and no database.
 */
export async function safeFetch<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await apiFetch<T>(path, init);
  } catch {
    return fallback;
  }
}

/** POST helper for client components (newsletter, comments, orders). */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export { API_URL };
