import type { Paginated, RedirectInput } from "@daily-pulse/shared";
import { Redirect } from "../models/Redirect";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeRedirect } from "../utils/serializers";

export const RedirectsService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const { count, rows } = await Redirect.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
    });
    return paginate(
      rows.map((r) => serializeRedirect(r.get({ plain: true }))),
      count,
      params,
    );
  },

  /** Resolve a path → active redirect (used by the web app's middleware). */
  async resolve(from: string): Promise<Record<string, unknown> | null> {
    const redirect = await Redirect.findOne({ where: { active: true, from } });
    if (!redirect) return null;
    await Redirect.increment("hits", { by: 1, where: { id: redirect.id } });
    return serializeRedirect(redirect.get({ plain: true }));
  },

  async create(input: RedirectInput): Promise<Record<string, unknown>> {
    const redirect = await Redirect.create({
      active: input.active ?? true,
      from: input.from,
      statusCode: input.statusCode ?? 301,
      to: input.to,
    });
    return serializeRedirect(redirect.get({ plain: true }));
  },

  async update(id: string, input: Partial<RedirectInput>): Promise<Record<string, unknown>> {
    const redirect = await Redirect.findByPk(id);
    if (!redirect) throw new ApiError(404, "REDIRECT_NOT_FOUND", "Redirect not found.");
    const patch: Record<string, unknown> = {};
    for (const key of ["from", "to", "statusCode", "active"] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    await redirect.update(patch);
    return serializeRedirect(redirect.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const redirect = await Redirect.findByPk(id);
    if (!redirect) throw new ApiError(404, "REDIRECT_NOT_FOUND", "Redirect not found.");
    await redirect.destroy();
  },
};
