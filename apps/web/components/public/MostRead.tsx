import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { Post } from "@daily-pulse/shared";

export default function MostRead({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section
      aria-label="Most read"
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
    >
      <h2 className="flex items-center gap-2 border-b border-neutral-200 pb-3 font-serif text-lg font-bold text-neutral-900">
        <TrendingUp className="h-5 w-5 text-brand-600" aria-hidden /> Most Read
      </h2>
      <ol className="divide-y divide-neutral-200">
        {posts.map((post, i) => (
          <li key={post._id} className="flex gap-3 py-3">
            <span className="font-serif text-2xl font-bold text-brand-600/60">{i + 1}</span>
            <Link
              href={`/article/${post.slug}`}
              className="text-sm leading-snug font-medium text-neutral-800 hover:text-brand-600"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
