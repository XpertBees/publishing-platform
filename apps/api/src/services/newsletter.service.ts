import type { NewsletterInput, Paginated } from "@daily-pulse/shared";
import { NewsletterSubscriber } from "../models/NewsletterSubscriber";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeSubscriber } from "../utils/serializers";

export const NewsletterService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (typeof query.status === "string" && query.status) where.status = query.status;
    const { count, rows } = await NewsletterSubscriber.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((s) => serializeSubscriber(s.get({ plain: true }))),
      count,
      params,
    );
  },

  /** Public subscribe — idempotent: re-subscribes an unsubscribed email. */
  async subscribe(input: NewsletterInput): Promise<Record<string, unknown>> {
    const [sub] = await NewsletterSubscriber.findOrCreate({
      defaults: { email: input.email, source: input.source ?? null, status: "subscribed" },
      where: { email: input.email },
    });
    if (sub.status !== "subscribed") await sub.update({ status: "subscribed" });
    return serializeSubscriber(sub.get({ plain: true }));
  },

  async unsubscribe(email: string): Promise<Record<string, unknown>> {
    const sub = await NewsletterSubscriber.findOne({ where: { email } });
    if (!sub) throw new ApiError(404, "SUBSCRIBER_NOT_FOUND", "Email is not subscribed.");
    await sub.update({ status: "unsubscribed" });
    return serializeSubscriber(sub.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const sub = await NewsletterSubscriber.findByPk(id);
    if (!sub) throw new ApiError(404, "SUBSCRIBER_NOT_FOUND", "Subscriber not found.");
    await sub.destroy();
  },
};
