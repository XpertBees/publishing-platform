import type { AffiliateLinkInput, Paginated } from "@daily-pulse/shared";
import { AffiliateLink } from "../models/AffiliateLink";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeAffiliateLink } from "../utils/serializers";

export const AffiliatesService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const { count, rows } = await AffiliateLink.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
    });
    return paginate(
      rows.map((a) => serializeAffiliateLink(a.get({ plain: true }))),
      count,
      params,
    );
  },

  async create(input: AffiliateLinkInput): Promise<Record<string, unknown>> {
    const link = await AffiliateLink.create({
      active: input.active ?? true,
      category: input.category ?? null,
      slug: input.slug,
      targetUrl: input.targetUrl,
      title: input.title,
    });
    return serializeAffiliateLink(link.get({ plain: true }));
  },

  async update(id: string, input: Partial<AffiliateLinkInput>): Promise<Record<string, unknown>> {
    const link = await AffiliateLink.findByPk(id);
    if (!link) throw new ApiError(404, "AFFILIATE_NOT_FOUND", "Affiliate link not found.");
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "targetUrl", "slug", "category", "active"] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    await link.update(patch);
    return serializeAffiliateLink(link.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const link = await AffiliateLink.findByPk(id);
    if (!link) throw new ApiError(404, "AFFILIATE_NOT_FOUND", "Affiliate link not found.");
    await link.destroy();
  },

  /**
   * Resolve /go/:slug → target URL, counting the click. Inactive links 404.
   * Also records an affiliate_click analytics event (best-effort).
   */
  async resolve(slug: string): Promise<string> {
    const link = await AffiliateLink.findOne({ where: { active: true, slug } });
    if (!link) throw new ApiError(404, "AFFILIATE_NOT_FOUND", "Affiliate link not found.");
    await AffiliateLink.increment("clicks", { by: 1, where: { id: link.id } });
    try {
      await AnalyticsEvent.create({ path: `/go/${slug}`, type: "affiliate_click" });
    } catch {
      // Analytics must never break the redirect.
    }
    return link.targetUrl;
  },
};
