import type { OrderInput, Paginated } from "@daily-pulse/shared";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeOrder } from "../utils/serializers";

/**
 * OrdersService. Payment is STUBBED: no gateway is configured yet, so every
 * order is recorded with provider="manual" and status="pending". When a
 * gateway lands, this is the single place that changes.
 */
export const OrdersService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: Record<string, unknown> = {};
    if (typeof query.status === "string" && query.status) where.status = query.status;
    if (typeof query.buyerEmail === "string" && query.buyerEmail)
      where.buyerEmail = query.buyerEmail;
    const { count, rows } = await Order.findAndCountAll({
      include: [{ model: Product }],
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((o) => serializeOrder(o.get({ plain: true }) as Record<string, unknown>)),
      count,
      params,
    );
  },

  async getById(id: string): Promise<Record<string, unknown>> {
    const order = await Order.findByPk(id, { include: [{ model: Product }] });
    if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
    return serializeOrder(order.get({ plain: true }) as Record<string, unknown>);
  },

  async create(input: OrderInput): Promise<Record<string, unknown>> {
    const product = await Product.findByPk(input.product);
    if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    if (!product.active)
      throw new ApiError(400, "PRODUCT_INACTIVE", "This product is not for sale.");
    const order = await Order.create({
      amount: product.price,
      buyerEmail: input.buyerEmail,
      currency: product.currency,
      productId: product.id,
      productName: product.name,
      provider: "manual",
      providerRef: null,
      status: "pending",
    });
    const fresh = await Order.findByPk(order.id, { include: [{ model: Product }] });
    return serializeOrder((fresh ?? order).get({ plain: true }) as Record<string, unknown>);
  },

  /** Manual status transition (e.g. mark paid once payment is confirmed). */
  async updateStatus(
    id: string,
    status: "pending" | "paid" | "failed" | "refunded",
  ): Promise<Record<string, unknown>> {
    const order = await Order.findByPk(id, { include: [{ model: Product }] });
    if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
    await order.update({ status });
    if (status === "paid") {
      await Product.increment("sales", { by: 1, where: { id: order.productId } });
    }
    const fresh = await Order.findByPk(id, { include: [{ model: Product }] });
    return serializeOrder((fresh ?? order).get({ plain: true }) as Record<string, unknown>);
  },
};
