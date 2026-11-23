import Parser from "rss-parser";
import { slugify, type Paginated, type RssSourceInput } from "@daily-pulse/shared";
import { Category } from "../models/Category";
import { Post } from "../models/Post";
import { RssItem } from "../models/RssItem";
import { RssSource } from "../models/RssSource";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeRssItem, serializeRssSource } from "../utils/serializers";

const parser = new Parser({
  headers: { "User-Agent": process.env.RSS_USER_AGENT ?? "DailyPulseBot/1.0" },
  timeout: 15000,
});

export interface FetchResult {
  created: number;
  postsCreated: number;
  skipped: number;
  sourceId: string;
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function ensureUniquePostSlug(base: string): Promise<string> {
  let slug = base || "news";
  let suffix = 2;
  for (;;) {
    const existing = await Post.findOne({ where: { slug } });
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

/**
 * Auto-create a draft news Post for a newly ingested RssItem. The category
 * comes from the source's category slug (falling back to "breaking-news").
 * Returns the created post id, or null when no matching category exists.
 */
async function createDraftPost(source: RssSource, item: RssItem): Promise<string | null> {
  const category =
    (await Category.findOne({ where: { slug: source.category } })) ??
    (await Category.findOne({ where: { slug: "breaking-news" } }));
  if (!category) return null;
  const slug = await ensureUniquePostSlug(slugify(item.title));
  const post = await Post.create({
    affiliateDisclosure: false,
    authorId: null,
    body: null,
    canonicalUrl: null,
    categoryId: category.id,
    ctaLabel: "Read More",
    externalUrl: item.link,
    featuredImage: null,
    gallery: [],
    headline: null,
    language: "en",
    postType: "news",
    publishedAt: null,
    seo: { keywords: [], noIndex: false },
    slug,
    sourceName: source.name,
    sourceUrl: item.link,
    sponsored: false,
    status: "draft",
    summary: item.summary ?? null,
    title: item.title,
  });
  return post.id;
}

/**
 * Fetch one source's feed, upsert items by guid (dedup), and auto-create a
 * draft news Post per new item. Idempotent — re-running skips known guids.
 */
export async function fetchSource(source: RssSource): Promise<FetchResult> {
  const feed = await parser.parseURL(source.url);
  let created = 0;
  let skipped = 0;
  let postsCreated = 0;
  for (const entry of feed.items ?? []) {
    const link = entry.link ?? "";
    if (!link) {
      skipped += 1;
      continue;
    }
    const guid = entry.guid ?? link;
    const summary = entry.contentSnippet
      ? stripHtml(entry.contentSnippet).slice(0, 500)
      : entry.content
        ? stripHtml(entry.content).slice(0, 500)
        : null;
    const publishedAt = entry.pubDate ? new Date(entry.pubDate) : null;
    const [item, isNew] = await RssItem.findOrCreate({
      defaults: {
        category: source.category,
        guid,
        imported: false,
        link,
        postId: null,
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
        sourceId: source.id,
        sourceName: source.name,
        summary,
        title: entry.title ?? link,
      },
      where: { guid },
    });
    if (!isNew) {
      skipped += 1;
      continue;
    }
    created += 1;
    if (!item.imported) {
      const postId = await createDraftPost(source, item);
      if (postId) {
        postsCreated += 1;
        await item.update({ imported: true, postId });
      }
    }
  }
  await source.update({ lastFetchedAt: new Date(), lastItemCount: created });
  return { created, postsCreated, skipped, sourceId: source.id };
}

export const RssService = {
  async listSources(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (query.active !== undefined) where.active = query.active === "true";
    const { count, rows } = await RssSource.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["name", "ASC"]],
      where,
    });
    return paginate(
      rows.map((s) => serializeRssSource(s.get({ plain: true }))),
      count,
      params,
    );
  },

  async getSource(id: string): Promise<Record<string, unknown>> {
    const source = await RssSource.findByPk(id);
    if (!source) throw new ApiError(404, "RSS_SOURCE_NOT_FOUND", "RSS source not found.");
    return serializeRssSource(source.get({ plain: true }));
  },

  async createSource(input: RssSourceInput): Promise<Record<string, unknown>> {
    const source = await RssSource.create({
      active: input.active ?? true,
      category: input.category,
      fetchIntervalMinutes: input.fetchIntervalMinutes ?? 15,
      name: input.name,
      url: input.url,
    });
    return serializeRssSource(source.get({ plain: true }));
  },

  async updateSource(id: string, input: Partial<RssSourceInput>): Promise<Record<string, unknown>> {
    const source = await RssSource.findByPk(id);
    if (!source) throw new ApiError(404, "RSS_SOURCE_NOT_FOUND", "RSS source not found.");
    const patch: Record<string, unknown> = {};
    for (const key of ["name", "url", "category", "active", "fetchIntervalMinutes"] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    await source.update(patch);
    return serializeRssSource(source.get({ plain: true }));
  },

  async removeSource(id: string): Promise<void> {
    const source = await RssSource.findByPk(id);
    if (!source) throw new ApiError(404, "RSS_SOURCE_NOT_FOUND", "RSS source not found.");
    await source.destroy();
  },

  /** Manual fetch trigger — fetches now and returns the ingestion summary. */
  async fetchNow(id: string): Promise<FetchResult> {
    const source = await RssSource.findByPk(id);
    if (!source) throw new ApiError(404, "RSS_SOURCE_NOT_FOUND", "RSS source not found.");
    try {
      return await fetchSource(source);
    } catch (err) {
      throw new ApiError(
        502,
        "RSS_FETCH_FAILED",
        `Failed to fetch ${source.url}: ${(err as Error).message}`,
      );
    }
  },

  async listItems(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (typeof query.source === "string" && query.source) where.sourceId = query.source;
    if (typeof query.category === "string" && query.category) where.category = query.category;
    if (query.imported !== undefined) where.imported = query.imported === "true";
    const { count, rows } = await RssItem.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["publishedAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((i) => serializeRssItem(i.get({ plain: true }))),
      count,
      params,
    );
  },

  /**
   * Manual import: create a draft news Post from an already-ingested item.
   * Idempotent — returns the existing post when the item is already imported.
   */
  async importItem(itemId: string): Promise<Record<string, unknown>> {
    const item = await RssItem.findByPk(itemId);
    if (!item) throw new ApiError(404, "RSS_ITEM_NOT_FOUND", "RSS item not found.");
    if (item.imported && item.postId) {
      const existing = await Post.findByPk(item.postId);
      if (existing) return { imported: true, postId: existing.id };
    }
    const source = await RssSource.findByPk(item.sourceId);
    if (!source) throw new ApiError(404, "RSS_SOURCE_NOT_FOUND", "RSS source not found.");
    const postId = await createDraftPost(source, item);
    if (!postId) throw new ApiError(400, "IMPORT_FAILED", "No matching category for this item.");
    await item.update({ imported: true, postId });
    return { imported: true, postId };
  },
};
