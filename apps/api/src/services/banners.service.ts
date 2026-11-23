import type { BannerInput, Paginated } from "@daily-pulse/shared";
import { Banner } from "../models/Banner";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeBanner } from "../utils/serializers";

export const BannersService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (typeof query.placement === "string" && query.placement) where.placement = query.placement;
    if (query.active !== undefined) where.active = query.active === "true";
    const { count, rows } = await Banner.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((b) => serializeBanner(b.get({ plain: true }))),
      count,
      params,
    );
  },

  /** Public: currently active banners for a placement (window-checked). */
  async listActive(placement: string): Promise<Record<string, unknown>[]> {
    const now = new Date();
    const rows = await Banner.findAll({
      order: [["createdAt", "DESC"]],
      where: { active: true, placement },
    });
    return rows
      .filter((b) => {
        if (b.startsAt && b.startsAt > now) return false;
        if (b.endsAt && b.endsAt < now) return false;
        return true;
      })
      .map((b) => serializeBanner(b.get({ plain: true })));
  },

  async create(input: BannerInput): Promise<Record<string, unknown>> {
    const banner = await Banner.create({
      active: input.active ?? true,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl ?? null,
      placement: input.placement,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      title: input.title,
    });
    return serializeBanner(banner.get({ plain: true }));
  },

  async update(id: string, input: Partial<BannerInput>): Promise<Record<string, unknown>> {
    const banner = await Banner.findByPk(id);
    if (!banner) throw new ApiError(404, "BANNER_NOT_FOUND", "Banner not found.");
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "imageUrl", "linkUrl", "placement", "active"] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    if (input.startsAt !== undefined)
      patch.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.endsAt !== undefined) patch.endsAt = input.endsAt ? new Date(input.endsAt) : null;
    await banner.update(patch);
    return serializeBanner(banner.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const banner = await Banner.findByPk(id);
    if (!banner) throw new ApiError(404, "BANNER_NOT_FOUND", "Banner not found.");
    await banner.destroy();
  },

  async recordClick(id: string): Promise<void> {
    await Banner.increment("clicks", { by: 1, where: { id } });
  },

  async recordImpression(id: string): Promise<void> {
    await Banner.increment("impressions", { by: 1, where: { id } });
  },
};
