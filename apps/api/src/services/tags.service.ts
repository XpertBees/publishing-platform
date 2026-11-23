import type { Paginated, TagInput } from "@daily-pulse/shared";
import { Tag } from "../models/Tag";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeTag } from "../utils/serializers";

export const TagsService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const { count, rows } = await Tag.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["name", "ASC"]],
    });
    return paginate(
      rows.map((t) => serializeTag(t.get({ plain: true }))),
      count,
      params,
    );
  },

  async create(input: TagInput): Promise<Record<string, unknown>> {
    const [tag, created] = await Tag.findOrCreate({
      defaults: { name: input.name, slug: input.slug },
      where: { slug: input.slug },
    });
    if (!created) throw new ApiError(409, "TAG_EXISTS", "A tag with this slug already exists.");
    return serializeTag(tag.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const tag = await Tag.findByPk(id);
    if (!tag) throw new ApiError(404, "TAG_NOT_FOUND", "Tag not found.");
    await tag.destroy();
  },
};
