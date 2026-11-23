import type { WhereOptions } from "sequelize";
import type { CommentInput, Paginated } from "@daily-pulse/shared";
import { Comment } from "../models/Comment";
import { Post } from "../models/Post";
import { ApiError } from "../utils/errors";
import { paginate, parsePagination, type PaginationParams } from "../utils/pagination";
import { serializeComment } from "../utils/serializers";

type CommentStatus = "pending" | "approved" | "spam" | "rejected";

export const CommentsService = {
  /** Public: approved comments for a post, newest first. */
  async listForPost(
    postId: string,
    query: Record<string, unknown>,
  ): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const post = await Post.findByPk(postId);
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    const { count, rows } = await Comment.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where: { postId, status: "approved" },
    });
    return paginate(
      rows.map((c) => serializeComment(c.get({ plain: true }))),
      count,
      params,
    );
  },

  /** Moderation queue: all statuses, filterable. */
  async listAll(query: Record<string, unknown>): Promise<Paginated<Record<string, unknown>>> {
    const params: PaginationParams = parsePagination(query);
    const where: WhereOptions = {};
    if (typeof query.status === "string" && query.status) where.status = query.status;
    if (typeof query.post === "string" && query.post) where.postId = query.post;
    const { count, rows } = await Comment.findAndCountAll({
      limit: params.limit,
      offset: params.offset,
      order: [["createdAt", "DESC"]],
      where,
    });
    return paginate(
      rows.map((c) => serializeComment(c.get({ plain: true }))),
      count,
      params,
    );
  },

  /** Public create — always starts as "pending" (moderation first). */
  async create(input: CommentInput): Promise<Record<string, unknown>> {
    const post = await Post.findByPk(input.post);
    if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found.");
    const comment = await Comment.create({
      authorEmail: input.authorEmail ?? null,
      authorName: input.authorName,
      body: input.body,
      postId: post.id,
      status: "pending",
    });
    return serializeComment(comment.get({ plain: true }));
  },

  async setStatus(id: string, status: CommentStatus): Promise<Record<string, unknown>> {
    const comment = await Comment.findByPk(id);
    if (!comment) throw new ApiError(404, "COMMENT_NOT_FOUND", "Comment not found.");
    await comment.update({ status });
    return serializeComment(comment.get({ plain: true }));
  },

  async remove(id: string): Promise<void> {
    const comment = await Comment.findByPk(id);
    if (!comment) throw new ApiError(404, "COMMENT_NOT_FOUND", "Comment not found.");
    await comment.destroy();
  },
};
