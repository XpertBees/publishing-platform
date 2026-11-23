import { Op, type Includeable, type WhereOptions } from "sequelize";
import {
  slugify,
  type Paginated,
  type PostCreateInput,
  type PostUpdateInput,
} from "@daily-pulse/shared";
import { Author } from "../models/Author";
import { Category } from "../models/Category";
import { Post } from "../models/Post";
import { Tag } from "../models/Tag";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializePost } from "../utils/serializers";

const POST_INCLUDES = [{ model: Author }, { model: Category }, { model: Tag }];

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "post";
  let suffix = 2;
  for (;;) {
    const where: WhereOptions = { slug };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Post.findOne({ where });
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function resolveCategory(slug: string): Promise<Category> {
  const category = await Category.findOne({ where: { slug } });
  if (!category) throw new ApiError(400, "INVALID_CATEGORY", `No category with slug "${slug}".`);
  return category;
}

async function resolveTags(tagSlugs: string[]): Promise<Tag[]> {
  const tags: Tag[] = [];
  for (const raw of tagSlugs) {
    const slug = slugify(raw);
    if (!slug) continue;
    const [tag] = await Tag.findOrCreate({ defaults: { name: raw, slug }, where: { slug } });
    tags.push(tag);
  }
  return tags;
}

async function syncTags(post: Post, tagSlugs: string[]): Promise<void> {
  const tags = await resolveTags(tagSlugs);
  await (post as unknown as { setTags: (ids: string[]) => Promise<void> }).setTags(
    tags.map((t) => t.id),
  );
}

function toPlain(post: Post): Record<string, unknown> {
  return post.get({ plain: true }) as Record<string, unknown>;
}

export const PostsService = {
  async list(
    query: Record<string, unknown>,
    canSeeUnpublished: boolean,
  ): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: WhereOptions = {};
    // Public callers only ever see published posts.
    const requestedStatus = typeof query.status === "string" ? query.status : undefined;
    where.status = canSeeUnpublished && requestedStatus ? requestedStatus : "published";
    if (typeof query.postType === "string" && query.postType) where.postType = query.postType;
    if (typeof query.category === "string" && query.category) {
      const category = await Category.findOne({ where: { slug: query.category } });
      if (!category) return paginate([], 0, params);
      where.categoryId = category.id;
    }
    // `q` is an alias for `search` (used by the public site's fallback).
    const searchTerm =
      typeof query.search === "string" && query.search
        ? query.search
        : typeof query.q === "string" && query.q
          ? query.q
          : undefined;
    if (searchTerm) {
      const like = `%${searchTerm}%`;
      Object.assign(where, {
        [Op.or]: [{ summary: { [Op.like]: like } }, { title: { [Op.like]: like } }],
      });
    }
    const include: Includeable[] = [...POST_INCLUDES];
    if (typeof query.tag === "string" && query.tag) {
      include[2] = { model: Tag, where: { slug: query.tag } };
    }
    const { count, rows } = await Post.findAndCountAll({
      distinct: true,
      include,
      limit: params.limit,
      offset: params.offset,
      order:
        query.sort === "views"
          ? [
              ["views", "DESC"],
              ["publishedAt", "DESC"],
            ]
          : [
              ["publishedAt", "DESC"],
              ["createdAt", "DESC"],
            ],
      where,
    });
    return paginate(
      rows.map((p) => serializePost(toPlain(p))),
      count,
      params,
    );
  },

  async getBySlug(slug: string, canSeeUnpublished: boolean): Promise<Record<string, unknown>> {
    const where: WhereOptions = { slug };
    if (!canSeeUnpublished) where.status = "published";
    const post = await Post.findOne({ include: POST_INCLUDES, where });
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    return serializePost(toPlain(post));
  },

  async getById(id: string): Promise<Record<string, unknown>> {
    const post = await Post.findByPk(id, { include: POST_INCLUDES });
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    return serializePost(toPlain(post));
  },

  async create(input: PostCreateInput): Promise<Record<string, unknown>> {
    const category = await resolveCategory(input.category);
    let authorId: string | null = null;
    if (input.author) {
      const author = await Author.findByPk(input.author);
      if (!author)
        throw new ApiError(400, "INVALID_AUTHOR", `No author with id "${input.author}".`);
      authorId = author.id;
    }
    const slug = await ensureUniqueSlug(slugify(input.title));
    const publishedAt =
      input.status === "published"
        ? input.publishedAt
          ? new Date(input.publishedAt)
          : new Date()
        : input.publishedAt
          ? new Date(input.publishedAt)
          : null;
    const post = await Post.create({
      affiliateDisclosure: input.affiliateDisclosure ?? false,
      authorId,
      body: (input.body ?? null) as Post["body"],
      canonicalUrl: input.canonicalUrl ?? null,
      categoryId: category.id,
      ctaLabel: input.ctaLabel ?? "Read More",
      externalUrl: input.externalUrl ?? null,
      featuredImage: input.featuredImage ?? null,
      gallery: input.gallery ?? [],
      headline: input.headline ?? null,
      language: input.language ?? "en",
      postType: input.postType,
      publishedAt,
      seo: (input.seo ?? { keywords: [], noIndex: false }) as Post["seo"],
      slug,
      sourceName: input.sourceName ?? null,
      sourceUrl: input.sourceUrl ?? null,
      sponsored: input.sponsored ?? false,
      status: input.status ?? "draft",
      summary: input.summary ?? null,
      title: input.title,
    });
    await syncTags(post, input.tags ?? []);
    const fresh = await Post.findByPk(post.id, { include: POST_INCLUDES });
    return serializePost(toPlain(fresh ?? post));
  },

  async update(id: string, input: PostUpdateInput): Promise<Record<string, unknown>> {
    const post = await Post.findByPk(id, { include: POST_INCLUDES });
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) {
      patch.title = input.title;
      patch.slug = await ensureUniqueSlug(slugify(input.title), id);
    }
    if (input.category !== undefined) {
      const category = await resolveCategory(input.category);
      patch.categoryId = category.id;
    }
    if (input.author !== undefined) {
      if (input.author) {
        const author = await Author.findByPk(input.author);
        if (!author)
          throw new ApiError(400, "INVALID_AUTHOR", `No author with id "${input.author}".`);
        patch.authorId = author.id;
      } else {
        patch.authorId = null;
      }
    }
    for (const key of [
      "headline",
      "summary",
      "body",
      "featuredImage",
      "gallery",
      "externalUrl",
      "ctaLabel",
      "postType",
      "language",
      "status",
      "seo",
      "sponsored",
      "affiliateDisclosure",
      "canonicalUrl",
      "sourceName",
      "sourceUrl",
    ] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    if (input.publishedAt !== undefined)
      patch.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    // Publishing via PATCH sets publishedAt when missing.
    if (input.status === "published" && !post.publishedAt && !patch.publishedAt) {
      patch.publishedAt = new Date();
    }
    await post.update(patch);
    if (input.tags !== undefined) await syncTags(post, input.tags);
    const fresh = await Post.findByPk(id, { include: POST_INCLUDES });
    return serializePost(toPlain(fresh ?? post));
  },

  /** Publish now: status → published, publishedAt set when missing. */
  async publish(id: string, publishedAt?: string): Promise<Record<string, unknown>> {
    const post = await Post.findByPk(id);
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    await post.update({
      publishedAt: publishedAt ? new Date(publishedAt) : (post.publishedAt ?? new Date()),
      status: "published",
    });
    const fresh = await Post.findByPk(id, { include: POST_INCLUDES });
    return serializePost(toPlain(fresh ?? post));
  },

  /** Schedule for a future date: status → scheduled, publishedAt required. */
  async schedule(id: string, publishedAt: string): Promise<Record<string, unknown>> {
    const post = await Post.findByPk(id);
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    const when = new Date(publishedAt);
    if (Number.isNaN(when.getTime()))
      throw new ApiError(400, "INVALID_DATE", "publishedAt is not a valid date.");
    if (when <= new Date())
      throw new ApiError(400, "INVALID_DATE", "Scheduled date must be in the future.");
    await post.update({ publishedAt: when, status: "scheduled" });
    const fresh = await Post.findByPk(id, { include: POST_INCLUDES });
    return serializePost(toPlain(fresh ?? post));
  },

  async remove(id: string): Promise<void> {
    const post = await Post.findByPk(id);
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    await post.destroy();
  },

  /** Increment the view counter (fire-and-forget from the public read path). */
  async incrementViews(id: string): Promise<void> {
    await Post.increment("views", { by: 1, where: { id } });
  },
};
