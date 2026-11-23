import bcrypt from "bcryptjs";
import type { UserCreateInput } from "@daily-pulse/shared";
import { User } from "../models/User";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeUser } from "../utils/serializers";
import type { Paginated } from "@daily-pulse/shared";

export const UsersService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const { count, rows } = await User.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
    });
    return paginate(
      rows.map((u) => serializeUser(u.get({ plain: true }))),
      count,
      params,
    );
  },

  async getById(id: string): Promise<Record<string, unknown>> {
    const user = await User.findByPk(id);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
    return serializeUser(user.get({ plain: true }));
  },

  async create(input: UserCreateInput): Promise<Record<string, unknown>> {
    const existing = await User.findOne({ where: { email: input.email } });
    if (existing) throw new ApiError(409, "EMAIL_TAKEN", "A user with this email already exists.");
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await User.create({
      email: input.email,
      isActive: true,
      name: input.name,
      passwordHash,
      role: input.role,
    });
    return serializeUser(user.get({ plain: true }));
  },

  async update(
    id: string,
    input: Partial<UserCreateInput> & { isActive?: boolean },
  ): Promise<Record<string, unknown>> {
    const user = await User.findByPk(id);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
    if (input.email && input.email !== user.email) {
      const clash = await User.findOne({ where: { email: input.email } });
      if (clash) throw new ApiError(409, "EMAIL_TAKEN", "A user with this email already exists.");
    }
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email;
    if (input.role !== undefined) patch.role = input.role;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (input.password) patch.passwordHash = await bcrypt.hash(input.password, 10);
    await user.update(patch);
    return serializeUser(user.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");
    await user.destroy();
  },
};
