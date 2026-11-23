import { Op, fn, col } from "sequelize";
import type { Paginated } from "@daily-pulse/shared";
import { AffiliateLink } from "../models/AffiliateLink";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import { AuditLog } from "../models/AuditLog";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { Post } from "../models/Post";
import { Product } from "../models/Product";
import { RssItem } from "../models/RssItem";
import { RssSource } from "../models/RssSource";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeAnalyticsEvent, serializeAuditLog } from "../utils/serializers";

export const AnalyticsService = {
  /** Record an event (public — called by the web app on page views etc.). */
  async recordEvent(input: {
    path?: string;
    post?: string;
    referrer?: string;
    type: string;
  }): Promise<Record<string, unknown>> {
    let postId: string | null = null;
    if (input.post) {
      const post = await Post.findOne({
        where: { [Op.or]: [{ id: input.post }, { slug: input.post }] },
      });
      if (post) postId = post.id;
    }
    const event = await AnalyticsEvent.create({
      path: input.path ?? null,
      postId,
      referrer: input.referrer ?? null,
      type: input.type,
    });
    return serializeAnalyticsEvent(event.get({ plain: true }));
  },

  async listEvents(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (typeof query.type === "string" && query.type) where.type = query.type;
    if (typeof query.post === "string" && query.post) where.postId = query.post;
    const { count, rows } = await AnalyticsEvent.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((e) => serializeAnalyticsEvent(e.get({ plain: true }))),
      count,
      params,
    );
  },

  /** Overview aggregates for the analytics dashboard. */
  async overview(): Promise<Record<string, unknown>> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalViewsRow] = await Post.findAll({
      attributes: [[fn("COALESCE", fn("SUM", col("views")), 0), "totalViews"]],
      raw: true,
    });
    const totalViews = Number((totalViewsRow as unknown as { totalViews: number }).totalViews ?? 0);
    const eventsByType = await AnalyticsEvent.findAll({
      attributes: ["type", [fn("COUNT", col("id")), "count"]],
      group: ["type"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      raw: true,
      where: { createdAt: { [Op.gte]: since } },
    });
    const topPosts = await Post.findAll({
      attributes: ["slug", "title", "views"],
      limit: 10,
      order: [["views", "DESC"]],
      raw: true,
    });
    const affiliateClicks = await AffiliateLink.sum("clicks");
    const newsletterSubscribers = await NewsletterSubscriber.count({
      where: { status: "subscribed" },
    });
    const pageViews30d = await AnalyticsEvent.count({
      where: { createdAt: { [Op.gte]: since }, type: "page_view" },
    });
    return {
      affiliateClicks: Number(affiliateClicks ?? 0),
      eventsByType: (eventsByType as unknown as { count: string; type: string }[]).map((r) => ({
        count: Number(r.count),
        type: r.type,
      })),
      newsletterSubscribers,
      pageViews30d,
      topPosts,
      totalViews,
    };
  },
};

export const AdminService = {
  /** Dashboard stats (shared OverviewStats shape). */
  async overview(): Promise<Record<string, unknown>> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [totalPosts, publishedPosts, draftPosts, scheduledPosts] = await Promise.all([
      Post.count(),
      Post.count({ where: { status: "published" } }),
      Post.count({ where: { status: "draft" } }),
      Post.count({ where: { status: "scheduled" } }),
    ]);
    const [totalNewsItems, rssSourcesActive, rssItemsToday] = await Promise.all([
      RssItem.count(),
      RssSource.count({ where: { active: true } }),
      RssItem.count({ where: { createdAt: { [Op.gte]: startOfToday } } }),
    ]);
    const [totalViewsRow] = await Post.findAll({
      attributes: [[fn("COALESCE", fn("SUM", col("views")), 0), "totalViews"]],
      raw: true,
    });
    const totalViews = Number((totalViewsRow as unknown as { totalViews: number }).totalViews ?? 0);
    const topPosts = await Post.findAll({
      attributes: ["slug", "title", "views"],
      limit: 5,
      order: [["views", "DESC"]],
      raw: true,
    });
    const affiliateClicks = await AffiliateLink.sum("clicks");
    const newsletterSubscribers = await NewsletterSubscriber.count({
      where: { status: "subscribed" },
    });
    const productSales = await Product.sum("sales");
    const recentLogs = await AuditLog.findAll({ limit: 10, order: [["createdAt", "DESC"]] });
    return {
      affiliateClicks: Number(affiliateClicks ?? 0),
      draftPosts,
      newsletterSubscribers,
      productSales: Number(productSales ?? 0),
      publishedPosts,
      recentActivity: recentLogs.map((l) => serializeAuditLog(l.get({ plain: true }))),
      rssItemsToday,
      rssSourcesActive,
      scheduledPosts,
      topPosts,
      totalNewsItems,
      totalPosts,
      totalViews,
    };
  },

  async listAuditLogs(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (typeof query.entity === "string" && query.entity) where.entity = query.entity;
    if (typeof query.user === "string" && query.user) where.userId = query.user;
    const { count, rows } = await AuditLog.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((l) => serializeAuditLog(l.get({ plain: true }))),
      count,
      params,
    );
  },
};
