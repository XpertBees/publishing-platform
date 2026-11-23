/**
 * Serializers — map Sequelize rows (plain objects via `.get({ plain: true })`)
 * to the shared API shapes: `id` → `_id`, Dates → ISO strings,
 * category → slug + categoryName, tags → string[], author → authorName.
 * Pure functions operating on plain objects — unit tested without MySQL.
 */
import { slugify, type SeoMeta } from "@daily-pulse/shared";

/** Loose row type: a Sequelize plain object, possibly with includes. */
export type Row = Record<string, unknown>;

export function iso(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

export function isoOrNow(value: unknown): string {
  return iso(value) ?? new Date().toISOString();
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function defaultSeo(): SeoMeta {
  return { keywords: [], noIndex: false };
}

export function serializeSeo(value: unknown): SeoMeta {
  if (value && typeof value === "object") {
    const s = value as Record<string, unknown>;
    return {
      description: asString(s.description),
      keywords: Array.isArray(s.keywords)
        ? s.keywords.filter((k): k is string => typeof k === "string")
        : [],
      noIndex: typeof s.noIndex === "boolean" ? s.noIndex : false,
      ogImage: asString(s.ogImage),
      title: asString(s.title),
    };
  }
  return defaultSeo();
}

export function serializePost(row: Row): Record<string, unknown> {
  const categoryRaw = row.Category ?? row.category;
  const category =
    categoryRaw && typeof categoryRaw === "object" ? (categoryRaw as Row) : undefined;
  const authorRaw = row.Author ?? row.author;
  const author = authorRaw && typeof authorRaw === "object" ? (authorRaw as Row) : undefined;
  const tags = (row.Tags ?? row.tags) as unknown;
  const tagSlugs = Array.isArray(tags)
    ? tags.map((t) =>
        typeof t === "string" ? t : (asString((t as Row).slug) ?? asString((t as Row).name) ?? ""),
      )
    : asStringArray(row.tagSlugs);
  return {
    _id: row.id,
    affiliateDisclosure: Boolean(row.affiliateDisclosure ?? false),
    author: author ? author.id : (asString(row.author) ?? (row.authorId as string | undefined)),
    authorName: author ? author.name : undefined,
    body: row.body ?? undefined,
    canonicalUrl: row.canonicalUrl ?? undefined,
    category: category ? category.slug : (asString(row.category) ?? ""),
    categoryName: category ? category.name : undefined,
    createdAt: isoOrNow(row.createdAt),
    ctaLabel: asString(row.ctaLabel) ?? "Read More",
    externalUrl: row.externalUrl ?? undefined,
    featuredImage: row.featuredImage ?? undefined,
    gallery: asStringArray(row.gallery),
    headline: row.headline ?? undefined,
    language: asString(row.language) ?? "en",
    postType: row.postType,
    publishedAt: iso(row.publishedAt),
    seo: serializeSeo(row.seo),
    slug: row.slug,
    sourceName: row.sourceName ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    sponsored: Boolean(row.sponsored ?? false),
    status: row.status,
    summary: row.summary ?? undefined,
    tags: tagSlugs.filter(Boolean),
    title: row.title,
    updatedAt: isoOrNow(row.updatedAt),
    views: typeof row.views === "number" ? row.views : 0,
  };
}

export function serializeCategory(row: Row): Record<string, unknown> {
  const parent = (row.parent ?? row.Parent) as Row | undefined;
  return {
    _id: row.id,
    createdAt: isoOrNow(row.createdAt),
    description: row.description ?? undefined,
    isVertical: Boolean(row.isVertical ?? false),
    name: row.name,
    order: typeof row.order === "number" ? row.order : 0,
    parent: parent ? parent.id : (row.parentId ?? null),
    seo: row.seo ? serializeSeo(row.seo) : undefined,
    slug: row.slug,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeTag(row: Row): Record<string, unknown> {
  return { _id: row.id, createdAt: isoOrNow(row.createdAt), name: row.name, slug: row.slug };
}

export function serializeAuthor(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    createdAt: isoOrNow(row.createdAt),
    name: row.name,
    role: row.role ?? undefined,
    slug: row.slug,
    socials: (row.socials as Record<string, string> | undefined) ?? undefined,
    updatedAt: isoOrNow(row.updatedAt),
    userId: row.userId ?? undefined,
  };
}

export function serializeUser(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    createdAt: isoOrNow(row.createdAt),
    email: row.email,
    isActive: Boolean(row.isActive ?? true),
    name: row.name,
    role: row.role,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeRssSource(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    active: Boolean(row.active ?? true),
    category: row.category,
    createdAt: isoOrNow(row.createdAt),
    fetchIntervalMinutes:
      typeof row.fetchIntervalMinutes === "number" ? row.fetchIntervalMinutes : 15,
    lastFetchedAt: iso(row.lastFetchedAt),
    lastItemCount: typeof row.lastItemCount === "number" ? row.lastItemCount : 0,
    name: row.name,
    updatedAt: isoOrNow(row.updatedAt),
    url: row.url,
  };
}

export function serializeRssItem(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    category: row.category,
    createdAt: isoOrNow(row.createdAt),
    guid: row.guid,
    imported: Boolean(row.imported ?? false),
    link: row.link,
    postId: row.postId ?? undefined,
    publishedAt: iso(row.publishedAt),
    source: row.sourceId,
    sourceName: row.sourceName,
    summary: row.summary ?? undefined,
    title: row.title,
  };
}

export function serializeBanner(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    active: Boolean(row.active ?? true),
    clicks: typeof row.clicks === "number" ? row.clicks : 0,
    createdAt: isoOrNow(row.createdAt),
    endsAt: iso(row.endsAt),
    imageUrl: row.imageUrl,
    impressions: typeof row.impressions === "number" ? row.impressions : 0,
    linkUrl: row.linkUrl ?? undefined,
    placement: row.placement,
    startsAt: iso(row.startsAt),
    title: row.title,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeAffiliateLink(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    active: Boolean(row.active ?? true),
    category: row.category ?? undefined,
    clicks: typeof row.clicks === "number" ? row.clicks : 0,
    createdAt: isoOrNow(row.createdAt),
    slug: row.slug,
    targetUrl: row.targetUrl,
    title: row.title,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeProduct(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    active: Boolean(row.active ?? true),
    coverImage: row.coverImage ?? undefined,
    createdAt: isoOrNow(row.createdAt),
    currency: asString(row.currency) ?? "INR",
    description: row.description ?? undefined,
    fileUrl: row.fileUrl ?? undefined,
    name: row.name,
    price: typeof row.price === "number" ? row.price : 0,
    sales: typeof row.sales === "number" ? row.sales : 0,
    slug: row.slug,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeOrder(row: Row): Record<string, unknown> {
  const productRaw = row.Product ?? row.product;
  const product = productRaw && typeof productRaw === "object" ? (productRaw as Row) : undefined;
  return {
    _id: row.id,
    amount: typeof row.amount === "number" ? row.amount : 0,
    buyerEmail: row.buyerEmail,
    createdAt: isoOrNow(row.createdAt),
    currency: asString(row.currency) ?? "INR",
    product: product ? product.id : (asString(row.product) ?? row.productId),
    productName: product ? product.name : row.productName,
    provider: row.provider ?? undefined,
    providerRef: row.providerRef ?? undefined,
    status: row.status,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeSubscriber(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    createdAt: isoOrNow(row.createdAt),
    email: row.email,
    source: row.source ?? undefined,
    status: row.status,
  };
}

export function serializeComment(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    authorEmail: row.authorEmail ?? undefined,
    authorName: row.authorName,
    body: row.body,
    createdAt: isoOrNow(row.createdAt),
    post: row.postId,
    status: row.status,
  };
}

export function serializeMedia(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    alt: row.alt ?? undefined,
    createdAt: isoOrNow(row.createdAt),
    filename: row.filename,
    height: typeof row.height === "number" ? row.height : undefined,
    mimeType: row.mimeType,
    size: typeof row.size === "number" ? row.size : 0,
    uploadedBy: row.uploadedBy ?? undefined,
    url: row.url,
    width: typeof row.width === "number" ? row.width : undefined,
  };
}

export function serializeRedirect(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    active: Boolean(row.active ?? true),
    createdAt: isoOrNow(row.createdAt),
    from: row.from,
    hits: typeof row.hits === "number" ? row.hits : 0,
    statusCode: typeof row.statusCode === "number" ? row.statusCode : 301,
    to: row.to,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeSeoSettings(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    defaultDescription: row.defaultDescription,
    defaultOgImage: row.defaultOgImage ?? undefined,
    defaultTitle: row.defaultTitle,
    googleNewsEnabled: Boolean(row.googleNewsEnabled ?? true),
    robotsTxt: row.robotsTxt ?? undefined,
    twitterHandle: row.twitterHandle ?? undefined,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeSiteSettings(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    adsenseClientId: row.adsenseClientId ?? undefined,
    faviconUrl: row.faviconUrl ?? undefined,
    gaMeasurementId: row.gaMeasurementId ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    primaryColor: asString(row.primaryColor) ?? "#1d4ed8",
    siteName: row.siteName,
    socialLinks: (row.socialLinks as Record<string, string> | undefined) ?? undefined,
    tagline: row.tagline ?? undefined,
    updatedAt: isoOrNow(row.updatedAt),
  };
}

export function serializeAnalyticsEvent(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    createdAt: isoOrNow(row.createdAt),
    path: row.path ?? undefined,
    post: row.postId ?? undefined,
    referrer: row.referrer ?? undefined,
    type: row.type,
  };
}

export function serializeAuditLog(row: Row): Record<string, unknown> {
  return {
    _id: row.id,
    action: row.action,
    createdAt: isoOrNow(row.createdAt),
    entity: row.entity,
    entityId: row.entityId ?? undefined,
    meta: (row.meta as Record<string, unknown> | undefined) ?? undefined,
    user: row.userId ?? undefined,
  };
}

export { slugify };
