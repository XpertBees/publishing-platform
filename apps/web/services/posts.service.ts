import type { Category, Comment, Paginated, Post, Product } from "@daily-pulse/shared";
import { safeFetch } from "@/lib/api";

const EMPTY_PAGE: Paginated<Post> = { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

function postsPath(query: string): string {
  return `/posts${query ? `?${query}` : ""}`;
}

export async function getHomeFeed(pageSize = 20): Promise<Paginated<Post>> {
  return safeFetch<Paginated<Post>>(
    postsPath(`status=published&page=1&pageSize=${pageSize}`),
    EMPTY_PAGE,
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return safeFetch<Post | null>(`/posts/${encodeURIComponent(slug)}`, null);
}

export async function getPostsByCategory(
  category: string,
  page = 1,
  pageSize = 10,
): Promise<Paginated<Post>> {
  return safeFetch<Paginated<Post>>(
    postsPath(
      `status=published&category=${encodeURIComponent(category)}&page=${page}&pageSize=${pageSize}`,
    ),
    EMPTY_PAGE,
  );
}

export async function getPostsByTag(
  tag: string,
  page = 1,
  pageSize = 10,
): Promise<Paginated<Post>> {
  return safeFetch<Paginated<Post>>(
    postsPath(`status=published&tag=${encodeURIComponent(tag)}&page=${page}&pageSize=${pageSize}`),
    EMPTY_PAGE,
  );
}

export async function searchPosts(q: string, page = 1, pageSize = 10): Promise<Paginated<Post>> {
  if (!q.trim()) return EMPTY_PAGE;
  // Prefer the dedicated search endpoint; fall back to the list endpoint.
  const bySearch = await safeFetch<Paginated<Post> | null>(
    `/posts/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
    null,
  );
  if (bySearch) return bySearch;
  return safeFetch<Paginated<Post>>(
    postsPath(`status=published&q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`),
    EMPTY_PAGE,
  );
}

export async function getRelated(post: Post, limit = 4): Promise<Post[]> {
  const page = await getPostsByCategory(post.category, 1, limit + 1);
  return page.items.filter((p) => p.slug !== post.slug).slice(0, limit);
}

export async function getMostRead(limit = 5): Promise<Post[]> {
  const page = await safeFetch<Paginated<Post>>(
    postsPath(`status=published&sort=views&page=1&pageSize=${limit}`),
    EMPTY_PAGE,
  );
  return page.items.slice(0, limit);
}

export async function getCategories(): Promise<Category[]> {
  const page = await safeFetch<Paginated<Category> | Category[]>("/categories", []);
  return Array.isArray(page) ? page : (page.items ?? []);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getCommentsForPost(postId: string): Promise<Comment[]> {
  const page = await safeFetch<Paginated<Comment> | Comment[]>(
    `/comments/post/${encodeURIComponent(postId)}`,
    [],
  );
  return Array.isArray(page) ? page : (page.items ?? []);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return safeFetch<Product | null>(`/products/${encodeURIComponent(slug)}`, null);
}
