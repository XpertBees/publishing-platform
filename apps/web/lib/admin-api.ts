"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, Paginated } from "@daily-pulse/shared";

/** Error thrown by the admin API client. `status` is the HTTP status. */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: ApiResponse<T> | null = null;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.message ?? `Request failed with status ${res.status}`,
      json?.error?.code,
    );
  }
  if (!json || !json.success) {
    throw new ApiError(res.status, json?.error?.message ?? "API error", json?.error?.code);
  }
  return json.data;
}

/** Typed client for the Express API, via the Next.js /api/proxy route
 *  handler. Client code never sees tokens. */
export const adminApi = {
  get: <T>(path: string) => request<T>(path),

  /** GET a list endpoint. Accepts either a Paginated envelope or a bare array. */
  list: async <T>(path: string): Promise<Paginated<T>> => {
    const data = await request<Paginated<T> | T[]>(path);
    if (Array.isArray(data)) {
      return { items: data, total: data.length, page: 1, pageSize: data.length, totalPages: 1 };
    }
    return data;
  },

  create: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  update: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  remove: (path: string) => request<unknown>(path, { method: "DELETE" }),

  /** POST with no resource body (actions such as fetch-now / import). */
  action: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  /** Multipart upload (media). The proxy forwards the FormData as-is. */
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", body: form }),
};

export interface UseAdminListResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Fetch a paginated list endpoint and expose loading / error / refresh. */
export function useAdminList<T>(path: string, page = 1, pageSize = 20): UseAdminListResult<T> {
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sep = path.includes("?") ? "&" : "?";
      const result = await adminApi.list<T>(`${path}${sep}page=${page}&pageSize=${pageSize}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [path, page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading,
    error,
    refresh,
  };
}
