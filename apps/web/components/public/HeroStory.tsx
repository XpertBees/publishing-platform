import Image from "next/image";
import Link from "next/link";
import type { Post } from "@daily-pulse/shared";
import { formatDate } from "@/lib/site";
import SponsoredBadge from "./SponsoredBadge";

export default function HeroStory({ post }: { post: Post }) {
  return (
    <article className="group">
      {post.featuredImage ? (
        <Link
          href={`/article/${post.slug}`}
          className="relative block aspect-[16/9] overflow-hidden rounded-lg"
        >
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
      ) : null}
      <div className="mt-4">
        <p className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-brand-600 uppercase">
          {post.sponsored ? <SponsoredBadge /> : null}
          {post.categoryName ? (
            <Link href={`/category/${post.category}`}>{post.categoryName}</Link>
          ) : null}
          {post.publishedAt ? (
            <span className="font-normal text-neutral-500 normal-case">
              {formatDate(post.publishedAt)}
            </span>
          ) : null}
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight font-bold text-neutral-900 md:text-4xl">
          <Link href={`/article/${post.slug}`} className="hover:text-brand-600">
            {post.title}
          </Link>
        </h1>
        {post.summary ? (
          <p className="mt-3 text-base leading-relaxed text-neutral-600">{post.summary}</p>
        ) : null}
        {post.authorName ? (
          <p className="mt-3 text-sm text-neutral-500">By {post.authorName}</p>
        ) : null}
      </div>
    </article>
  );
}
