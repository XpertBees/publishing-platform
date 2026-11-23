import type { CategoryInput, Paginated } from "@daily-pulse/shared";
import { Category } from "../models/Category";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeCategory } from "../utils/serializers";

function plain(row: {
  get: (opts: { plain: boolean }) => Record<string, unknown>;
}): Record<string, unknown> {
  return row.get({ plain: true });
}

export const CategoriesService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const { count, rows } = await Category.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [
        ["order", "ASC"],
        ["name", "ASC"],
      ],
    });
    return paginate(
      rows.map((c) => serializeCategory(plain(c))),
      count,
      params,
    );
  },

  async getBySlug(slug: string): Promise<Record<string, unknown>> {
    const category = await Category.findOne({ where: { slug } });
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found.");
    return serializeCategory(plain(category));
  },

  async create(input: CategoryInput): Promise<Record<string, unknown>> {
    const parentId = input.parent ? ((await Category.findByPk(input.parent))?.id ?? null) : null;
    if (input.parent && !parentId)
      throw new ApiError(400, "INVALID_PARENT", "Parent category not found.");
    const category = await Category.create({
      description: input.description ?? null,
      isVertical: input.isVertical ?? false,
      name: input.name,
      order: input.order ?? 0,
      parentId,
      seo: (input.seo ?? null) as Category["seo"],
      slug: input.slug,
    });
    return serializeCategory(plain(category));
  },

  async update(id: string, input: Partial<CategoryInput>): Promise<Record<string, unknown>> {
    const category = await Category.findByPk(id);
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found.");
    const patch: Record<string, unknown> = {};
    for (const key of ["name", "slug", "description", "order", "isVertical", "seo"] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    if (input.parent !== undefined) {
      if (input.parent) {
        const parent = await Category.findByPk(input.parent);
        if (!parent) throw new ApiError(400, "INVALID_PARENT", "Parent category not found.");
        if (parent.id === id)
          throw new ApiError(400, "INVALID_PARENT", "A category cannot be its own parent.");
        patch.parentId = parent.id;
      } else {
        patch.parentId = null;
      }
    }
    await category.update(patch);
    return serializeCategory(plain(category));
  },

  async remove(id: string): Promise<void> {
    const category = await Category.findByPk(id);
    if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found.");
    await category.destroy();
  },
};
