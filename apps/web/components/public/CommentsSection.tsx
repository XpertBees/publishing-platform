"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare } from "lucide-react";
import type { Comment } from "@daily-pulse/shared";
import { API_URL } from "@/lib/api";
import { formatDateTime } from "@/lib/site";

const schema = z.object({
  authorName: z.string().min(1, "Name is required").max(120),
  authorEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  body: z.string().min(1, "Write a comment").max(2000),
});
type FormValues = z.infer<typeof schema>;

export default function CommentsSection({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: Comment[];
}) {
  const [comments] = useState<Comment[]>(initialComments);
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: postId, ...values }),
      });
      if (!res.ok) throw new Error("Submit failed");
      setStatus("done");
      reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section aria-label="Comments" className="mt-10 border-t border-neutral-200 pt-6">
      <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-neutral-900">
        <MessageSquare className="h-5 w-5 text-brand-600" aria-hidden /> Comments ({comments.length}
        )
      </h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          No comments yet — be the first to share your thoughts.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {comments.map((c) => (
            <li key={c._id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">{c.authorName}</p>
              <p className="text-xs text-neutral-500">{formatDateTime(c.createdAt)}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3" noValidate>
        <h3 className="font-semibold text-neutral-900">Leave a comment</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="comment-name"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Name
            </label>
            <input
              id="comment-name"
              {...register("authorName")}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
            {errors.authorName ? (
              <p className="mt-1 text-xs text-red-600">{errors.authorName.message}</p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="comment-email"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Email (optional)
            </label>
            <input
              id="comment-email"
              type="email"
              {...register("authorEmail")}
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
            {errors.authorEmail ? (
              <p className="mt-1 text-xs text-red-600">{errors.authorEmail.message}</p>
            ) : null}
          </div>
        </div>
        <div>
          <label htmlFor="comment-body" className="mb-1 block text-sm font-medium text-neutral-700">
            Comment
          </label>
          <textarea
            id="comment-body"
            rows={4}
            {...register("body")}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
          {errors.body ? <p className="mt-1 text-xs text-red-600">{errors.body.message}</p> : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? "Posting…" : "Post comment"}
        </button>
        {status === "done" ? (
          <p className="text-sm text-green-700">Thanks — your comment is awaiting moderation.</p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm text-red-600">
            Could not post your comment. Please try again later.
          </p>
        ) : null}
      </form>
    </section>
  );
}
