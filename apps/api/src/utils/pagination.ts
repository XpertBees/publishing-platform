import type { Paginated } from "@daily-pulse/shared";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
  limit: number;
  offset: number;
  page: number;
  pageSize: number;
}

/** Parse `page` / `pageSize` query params into limit/offset. Pure — unit tested. */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const rawPage = Number(query.page ?? 1);
  const rawSize = Number(query.pageSize ?? DEFAULT_PAGE_SIZE);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize = Number.isFinite(rawSize)
    ? Math.min(Math.max(Math.floor(rawSize), 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  return { limit: pageSize, offset: (page - 1) * pageSize, page, pageSize };
}

/** Wrap a page of items in the shared Paginated<T> shape. Pure — unit tested. */
export function paginate<T>(items: T[], total: number, params: PaginationParams): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  return { items, page: params.page, pageSize: params.pageSize, total, totalPages };
}
