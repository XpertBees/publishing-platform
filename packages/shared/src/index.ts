/**
 * @daily-pulse/shared — single source of truth for types + validation.
 * Both apps/api and apps/web import from here. Do not duplicate these
 * shapes in either app; extend here instead.
 */
import { z } from "zod";

// ── Roles & RBAC ────────────────────────────────────────────────────────

export const ROLES = [
  "super_admin",
  "admin",
  "editor",
  "author",
  "news_editor",
  "seo_manager",
  "marketing_manager",
  "analyst",
] as const;
export type Role = (typeof ROLES)[number];

/** Permissions are checked server-side on every protected endpoint. */
export const PERMISSIONS = [
  "posts.create",
  "posts.edit",
  "posts.publish",
  "posts.delete",
  "posts.view",
  "comments.moderate",
  "news.manage",
  "rss.manage",
  "categories.manage",
  "media.manage",
  "authors.manage",
  "banners.manage",
  "affiliates.manage",
  "products.manage",
  "orders.view",
  "newsletter.view",
  "seo.manage",
  "redirects.manage",
  "analytics.view",
  "users.manage",
  "settings.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Minimal role → permission map. The API is the authority; the web app
 *  only uses this for UI gating and must never rely on it for security. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [...PERMISSIONS],
  admin: PERMISSIONS.filter((p) => p !== "users.manage"),
  editor: [
    "posts.create",
    "posts.edit",
    "posts.publish",
    "posts.view",
    "categories.manage",
    "media.manage",
    "comments.moderate",
    "authors.manage",
  ],
  author: ["posts.create", "posts.edit", "posts.view", "media.manage"],
  news_editor: [
    "posts.create",
    "posts.edit",
    "posts.publish",
    "posts.view",
    "news.manage",
    "rss.manage",
    "media.manage",
  ],
  seo_manager: ["posts.view", "seo.manage", "redirects.manage", "analytics.view"],
  marketing_manager: [
    "banners.manage",
    "affiliates.manage",
    "products.manage",
    "newsletter.view",
    "posts.view",
  ],
  analyst: ["analytics.view", "posts.view", "orders.view", "newsletter.view"],
};

// ── Content verticals ───────────────────────────────────────────────────

export const VERTICALS = [
  { slug: "lifestyle", name: "Lifestyle" },
  { slug: "personal-finance", name: "Personal Finance" },
  { slug: "technology", name: "Technology" },
  { slug: "breaking-news", name: "Breaking News" },
] as const;
export type VerticalSlug = (typeof VERTICALS)[number]["slug"];

// ── Posts ──────────────────────────────────────────────────────────────

export const POST_TYPES = [
  "editorial",
  "news",
  "link_card",
  "product_recommendation",
  "sponsored",
  "guide",
  "review",
  "comparison",
  "digital_product",
] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_STATUSES = ["draft", "review", "published", "scheduled"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const seoMetaSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(200).optional(),
  keywords: z.array(z.string()).default([]),
  ogImage: z.string().url().optional().or(z.literal("")),
  noIndex: z.boolean().default(false),
});
export type SeoMeta = z.infer<typeof seoMetaSchema>;

/** Shared post shape — API responses and web pages use exactly this. */
export interface Post {
  _id: string;
  slug: string;
  title: string;
  headline?: string;
  summary?: string;
  /** Structured rich-text blocks (portable JSON, not raw HTML). */
  body?: unknown;
  featuredImage?: string;
  gallery?: string[];
  externalUrl?: string;
  ctaLabel: string;
  category: string; // Category slug
  categoryName?: string;
  tags: string[];
  author?: string; // Author _id
  authorName?: string;
  postType: PostType;
  language: string;
  status: PostStatus;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  seo: SeoMeta;
  sponsored: boolean;
  affiliateDisclosure: boolean;
  canonicalUrl?: string;
  sourceName?: string; // RSS source name for aggregated news
  sourceUrl?: string; // original article URL for aggregated news
  views: number;
}

export const postCreateSchema = z.object({
  title: z.string().min(1).max(120),
  headline: z.string().max(200).optional(),
  summary: z.string().max(500).optional(),
  body: z.unknown().optional(),
  featuredImage: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  externalUrl: z.string().url().optional(),
  ctaLabel: z.string().default("Read More"),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
  postType: z.enum(POST_TYPES),
  language: z.string().default("en"),
  status: z.enum(POST_STATUSES).default("draft"),
  publishedAt: z.string().datetime().optional(),
  seo: seoMetaSchema.partial().optional(),
  sponsored: z.boolean().default(false),
  affiliateDisclosure: z.boolean().default(false),
  canonicalUrl: z.string().url().optional(),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});
export type PostCreateInput = z.infer<typeof postCreateSchema>;

export const postUpdateSchema = postCreateSchema.partial();
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;

// ── Categories & tags ──────────────────────────────────────────────────

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | null;
  order: number;
  isVertical: boolean;
  seo?: SeoMeta;
  createdAt: string;
  updatedAt: string;
}

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  parent: z.string().nullable().optional(),
  order: z.number().int().default(0),
  isVertical: z.boolean().default(false),
  seo: seoMetaSchema.partial().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export const tagSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60),
});
export type TagInput = z.infer<typeof tagSchema>;

// ── Authors & users ────────────────────────────────────────────────────

export interface Author {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  role?: string;
  socials?: Record<string, string>;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export const authorSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  bio: z.string().max(1000).optional(),
  avatar: z.string().optional(),
  role: z.string().max(80).optional(),
  socials: z.record(z.string()).optional(),
  userId: z.string().optional(),
});
export type AuthorInput = z.infer<typeof authorSchema>;

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userCreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ROLES),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── RSS ────────────────────────────────────────────────────────────────

export interface RssSource {
  _id: string;
  name: string;
  url: string;
  category: string;
  active: boolean;
  fetchIntervalMinutes: number;
  lastFetchedAt?: string;
  lastItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export const rssSourceSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  category: z.string().min(1),
  active: z.boolean().default(true),
  fetchIntervalMinutes: z.number().int().min(5).max(1440).default(15),
});
export type RssSourceInput = z.infer<typeof rssSourceSchema>;

export interface RssItem {
  _id: string;
  guid: string;
  link: string;
  title: string;
  summary?: string;
  source: string; // RssSource _id
  sourceName: string;
  category: string;
  publishedAt?: string;
  imported: boolean;
  postId?: string;
  createdAt: string;
}

// ── Banners, affiliates, products, orders ─────────────────────────────

export interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  placement: string; // e.g. "home_hero", "sidebar", "in_article"
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  clicks: number;
  impressions: number;
  createdAt: string;
  updatedAt: string;
}

export const bannerSchema = z.object({
  title: z.string().min(1).max(120),
  imageUrl: z.string().min(1),
  linkUrl: z.string().url().optional(),
  placement: z.string().min(1),
  active: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});
export type BannerInput = z.infer<typeof bannerSchema>;

export interface AffiliateLink {
  _id: string;
  title: string;
  targetUrl: string;
  slug: string; // /go/<slug> redirect
  category?: string;
  clicks: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const affiliateLinkSchema = z.object({
  title: z.string().min(1).max(160),
  targetUrl: z.string().url(),
  slug: z.string().min(1).max(80),
  category: z.string().optional(),
  active: z.boolean().default(true),
});
export type AffiliateLinkInput = z.infer<typeof affiliateLinkSchema>;

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number; // minor units (paise/cents)
  currency: string;
  fileUrl?: string;
  coverImage?: string;
  active: boolean;
  sales: number;
  createdAt: string;
  updatedAt: string;
}

export const productSchema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  price: z.number().int().min(0),
  currency: z.string().default("INR"),
  fileUrl: z.string().optional(),
  coverImage: z.string().optional(),
  active: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

export interface Order {
  _id: string;
  product: string;
  productName: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  provider?: string;
  providerRef?: string;
  createdAt: string;
  updatedAt: string;
}

export const orderSchema = z.object({
  product: z.string().min(1),
  buyerEmail: z.string().email(),
});
export type OrderInput = z.infer<typeof orderSchema>;

// ── Newsletter, comments, media ────────────────────────────────────────

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  status: "subscribed" | "unsubscribed";
  source?: string;
  createdAt: string;
}

export const newsletterSchema = z.object({
  email: z.string().email(),
  source: z.string().max(80).optional(),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export interface Comment {
  _id: string;
  post: string;
  authorName: string;
  authorEmail?: string;
  body: string;
  status: "pending" | "approved" | "spam" | "rejected";
  createdAt: string;
}

export const commentSchema = z.object({
  post: z.string().min(1),
  authorName: z.string().min(1).max(120),
  authorEmail: z.string().email().optional(),
  body: z.string().min(1).max(2000),
});
export type CommentInput = z.infer<typeof commentSchema>;

export interface MediaItem {
  _id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  uploadedBy?: string;
  createdAt: string;
}

// ── Redirects, SEO & site settings ─────────────────────────────────────

export interface Redirect {
  _id: string;
  from: string;
  to: string;
  statusCode: 301 | 302;
  active: boolean;
  hits: number;
  createdAt: string;
  updatedAt: string;
}

export const redirectSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
  active: z.boolean().default(true),
});
export type RedirectInput = z.infer<typeof redirectSchema>;

export interface SeoSettings {
  _id: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage?: string;
  twitterHandle?: string;
  googleNewsEnabled: boolean;
  robotsTxt?: string;
  updatedAt: string;
}

export interface SiteSettings {
  _id: string;
  siteName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  adsenseClientId?: string;
  gaMeasurementId?: string;
  socialLinks?: Record<string, string>;
  updatedAt: string;
}

// ── Analytics & audit ──────────────────────────────────────────────────

export interface AnalyticsEvent {
  _id: string;
  type: string; // "page_view" | "affiliate_click" | "banner_click" | "download" | ...
  post?: string;
  path?: string;
  referrer?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user?: string;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// ── API envelope ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OverviewStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalNewsItems: number;
  rssSourcesActive: number;
  rssItemsToday: number;
  totalViews: number;
  topPosts: { slug: string; title: string; views: number }[];
  affiliateClicks: number;
  newsletterSubscribers: number;
  productSales: number;
  recentActivity: AuditLog[];
}

// ── Helpers ────────────────────────────────────────────────────────────

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export const API_BASE = "/api/v1";
