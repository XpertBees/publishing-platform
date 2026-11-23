/**
 * Validators — thin wrappers re-exporting the shared zod schemas from
 * `@daily-pulse/shared` (the single source of truth). Local schemas here
 * cover only things the shared package does not: query strings and
 * settings payloads.
 */
import { z } from "zod";

export {
  affiliateLinkSchema,
  authorSchema,
  bannerSchema,
  categorySchema,
  commentSchema,
  loginSchema,
  newsletterSchema,
  orderSchema,
  postCreateSchema,
  postUpdateSchema,
  productSchema,
  redirectSchema,
  rssSourceSchema,
  tagSchema,
  userCreateSchema,
} from "@daily-pulse/shared";

/** Shared list-query shape: page/pageSize + free-form filters. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const postListQuerySchema = paginationQuerySchema.extend({
  category: z.string().optional(),
  postType: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  status: z.string().optional(),
  tag: z.string().optional(),
});

export const analyticsEventSchema = z.object({
  path: z.string().max(500).optional(),
  post: z.string().optional(),
  referrer: z.string().max(500).optional(),
  type: z.string().min(1).max(60),
});

export const seoSettingsSchema = z.object({
  defaultDescription: z.string().min(1),
  defaultOgImage: z.string().optional(),
  defaultTitle: z.string().min(1).max(160),
  googleNewsEnabled: z.boolean().default(true),
  robotsTxt: z.string().optional(),
  twitterHandle: z.string().max(80).optional(),
});

export const siteSettingsSchema = z.object({
  adsenseClientId: z.string().max(80).optional(),
  faviconUrl: z.string().optional(),
  gaMeasurementId: z.string().max(40).optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().max(20).default("#1d4ed8"),
  siteName: z.string().min(1).max(120),
  socialLinks: z.record(z.string()).optional(),
  tagline: z.string().max(200).optional(),
});

export const commentStatusSchema = z.object({
  status: z.enum(["pending", "approved", "spam", "rejected"]),
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded"]),
});

export const publishSchema = z.object({
  publishedAt: z.string().datetime().optional(),
});

export const unsubscribeSchema = z.object({
  email: z.string().email(),
});
