import Image from "next/image";
import Link from "next/link";
import type { Post } from "@daily-pulse/shared";
import { formatDate } from "@/lib/site";
import SponsoredBadge from "./SponsoredBadge";

export default function StoryCard({ post }: { post: Post }) {
  return (
    <article className="flex gap-4 border-b border-neutral-200 py-4 first:pt-0 last:border-b-0">
      {post.featuredImage ? (
        <Link
          href={`/article/${post.slug}`}
          className="relative h-24 w-32 shrink-0 overflow-hidden rounded"
        >
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            sizes="128px"
            className="object-cover"
          />
        </Link>
      ) : null}
      <div className="min-w-0">
        <Link
          href={`/article/${post.slug}`}
          className="line-clamp-2 font-serif text-lg leading-snug font-semibold text-neutral-900 hover:text-brand-600"
        >
          {post.title}
        </Link>
        {post.summary ? (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{post.summary}</p>
        ) : null}
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          {post.sponsored ? <SponsoredBadge /> : null}
          {post.categoryName ? (
            <Link
              href={`/category/${post.category}`}
              className="font-semibold text-brand-600 uppercase"
            >
              {post.categoryName}
            </Link>
          ) : null}
          {post.authorName ? <span>{post.authorName}</span> : null}
          {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
        </p>
      </div>
    </article>
  );
}
