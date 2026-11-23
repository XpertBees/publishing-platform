import type { AuthorInput, Paginated } from "@daily-pulse/shared";
import { Author } from "../models/Author";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeAuthor } from "../utils/serializers";

export const AuthorsService = {
  async list(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const { count, rows } = await Author.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["name", "ASC"]],
    });
    return paginate(
      rows.map((a) => serializeAuthor(a.get({ plain: true }))),
      count,
      params,
    );
  },

  async getBySlug(slug: string): Promise<Record<string, unknown>> {
    const author = await Author.findOne({ where: { slug } });
    if (!author) throw new ApiError(404, "AUTHOR_NOT_FOUND", "Author not found.");
    return serializeAuthor(author.get({ plain: true }));
  },

  async create(input: AuthorInput): Promise<Record<string, unknown>> {
    const author = await Author.create({
      avatar: input.avatar ?? null,
      bio: input.bio ?? null,
      name: input.name,
      role: input.role ?? null,
      slug: input.slug,
      socials: input.socials ?? null,
      userId: input.userId ?? null,
    });
    return serializeAuthor(author.get({ plain: true }));
  },

  async update(id: string, input: Partial<AuthorInput>): Promise<Record<string, unknown>> {
    const author = await Author.findByPk(id);
    if (!author) throw new ApiError(404, "AUTHOR_NOT_FOUND", "Author not found.");
    const patch: Record<string, unknown> = {};
    for (const key of ["name", "slug", "bio", "avatar", "role", "socials", "userId"] as const) {
      if (input[key] !== undefined) patch[key] = input[key] as unknown;
    }
    await author.update(patch);
    return serializeAuthor(author.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const author = await Author.findByPk(id);
    if (!author) throw new ApiError(404, "AUTHOR_NOT_FOUND", "Author not found.");
    await author.destroy();
  },
};
