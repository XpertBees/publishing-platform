import type { MetadataRoute } from "next";
import { VERTICALS } from "@daily-pulse/shared";
import { safeFetch } from "@/lib/api";
import { SITE_URL } from "@/lib/site";
import type { Paginated, Post } from "@daily-pulse/shared";

const EMPTY: Paginated<Post> = { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };

/** Never throws: on API failure returns static category URLs only. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "");
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...VERTICALS.map((v) => ({
      url: `${base}/category/${v.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${base}/newsletter`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
  try {
    const feed = await safeFetch<Paginated<Post>>(
      "/posts?status=published&page=1&pageSize=50",
      EMPTY,
    );
    const postUrls: MetadataRoute.Sitemap = feed.items.map((post) => ({
      url: `${base}/article/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticUrls, ...postUrls];
  } catch {
    return staticUrls;
  }
}
