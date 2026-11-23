import type { Paginated, ProductInput } from "@daily-pulse/shared";
import { Product } from "../models/Product";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeProduct } from "../utils/serializers";

export const ProductsService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    // Public storefront sees active products only; staff see all.
    if (query.activeOnly === "true" || query.activeOnly === undefined) where.active = true;
    if (query.active !== undefined) where.active = query.active === "true";
    const { count, rows } = await Product.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((p) => serializeProduct(p.get({ plain: true }))),
      count,
      params,
    );
  },

  async getBySlug(slug: string): Promise<Record<string, unknown>> {
    const product = await Product.findOne({ where: { slug } });
    if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    return serializeProduct(product.get({ plain: true }));
  },

  async create(input: ProductInput): Promise<Record<string, unknown>> {
    const product = await Product.create({
      active: input.active ?? true,
      coverImage: input.coverImage ?? null,
      currency: input.currency ?? "INR",
      description: input.description ?? null,
      fileUrl: input.fileUrl ?? null,
      name: input.name,
      price: input.price,
      slug: input.slug,
    });
    return serializeProduct(product.get({ plain: true }));
  },

  async update(id: string, input: Partial<ProductInput>): Promise<Record<string, unknown>> {
    const product = await Product.findByPk(id);
    if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    const patch: Record<string, unknown> = {};
    for (const key of [
      "name",
      "slug",
      "description",
      "price",
      "currency",
      "fileUrl",
      "coverImage",
      "active",
    ] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    await product.update(patch);
    return serializeProduct(product.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const product = await Product.findByPk(id);
    if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    await product.destroy();
  },
};
