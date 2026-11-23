import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VERTICALS } from "@daily-pulse/shared";
import AdSlot from "@/components/ads/AdSlot";
import AffiliateCard from "@/components/public/AffiliateCard";
import ArticleBody from "@/components/public/ArticleBody";
import Breadcrumbs from "@/components/public/Breadcrumbs";
import CommentsSection from "@/components/public/CommentsSection";
import MostRead from "@/components/public/MostRead";
import RelatedArticles from "@/components/public/RelatedArticles";
import SponsoredBadge from "@/components/public/SponsoredBadge";
import ViewPing from "@/components/public/ViewPing";
import {
  getCommentsForPost,
  getMostRead,
  getPostBySlug,
  getRelated,
} from "@/services/posts.service";
import { canonicalFor, formatDateTime, SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return { title: "Article not found" };
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.summary || undefined;
  const url = canonicalFor(`/article/${post.slug}`, post.canonicalUrl);
  const ogImage = post.seo?.ogImage || post.featuredImage;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      siteName: SITE_NAME,
      publishedTime: post.publishedAt,
      authors: post.authorName ? [post.authorName] : undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: post.seo?.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [related, mostRead, comments] = await Promise.all([
    getRelated(post, 4),
    getMostRead(5),
    getCommentsForPost(post._id),
  ]);
  const categoryName =
    post.categoryName ?? VERTICALS.find((v) => v.slug === post.category)?.name ?? post.category;
  const canonical = canonicalFor(`/article/${post.slug}`, post.canonicalUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.summary,
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.authorName ? { "@type": "Person", name: post.authorName } : undefined,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: canonical,
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <ViewPing postId={post._id} path={`/article/${post.slug}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="lg:col-span-2">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: categoryName, href: `/category/${post.category}` },
            { label: post.title },
          ]}
        />
        {post.sponsored ? (
          <p className="mb-3">
            <SponsoredBadge />
          </p>
        ) : null}
        <h1 className="font-serif text-3xl leading-tight font-bold text-neutral-900 md:text-4xl">
          {post.headline ?? post.title}
        </h1>
        {post.summary ? (
          <p className="mt-3 text-lg leading-relaxed text-neutral-600">{post.summary}</p>
        ) : null}
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-neutral-200 py-3 text-sm text-neutral-600">
          {post.authorName ? (
            <span className="font-semibold text-neutral-900">By {post.authorName}</span>
          ) : null}
          {post.publishedAt ? <span>Published {formatDateTime(post.publishedAt)}</span> : null}
          {post.views > 0 ? <span>{post.views.toLocaleString("en-IN")} views</span> : null}
          {post.sourceName ? (
            <span>
              Source:{" "}
              {post.sourceUrl ? (
                <Link
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-brand-600 hover:underline"
                >
                  {post.sourceName}
                </Link>
              ) : (
                post.sourceName
              )}
            </span>
          ) : null}
        </p>
        {post.featuredImage ? (
          <figure className="mt-6">
            <span className="relative block aspect-[16/9] overflow-hidden rounded-lg">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
                className="object-cover"
              />
            </span>
          </figure>
        ) : null}

        <div className="mt-6">
          <ArticleBody post={post} />
        </div>

        {post.affiliateDisclosure ? (
          <aside className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Affiliate disclosure:</strong> This article contains affiliate links. We may
            earn a commission if you buy through them, at no extra cost to you.
          </aside>
        ) : null}

        {post.postType === "link_card" && post.externalUrl ? (
          <AffiliateCard
            title={post.title}
            url={post.externalUrl}
            ctaLabel={post.ctaLabel || "Read More"}
            disclosure={post.affiliateDisclosure}
          />
        ) : null}

        {post.tags.length > 0 ? (
          <p className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-brand-100 hover:text-brand-700"
              >
                #{tag}
              </Link>
            ))}
          </p>
        ) : null}

        <AdSlot slot="in-article" />
        <RelatedArticles posts={related} />
        <CommentsSection postId={post._id} initialComments={comments} />
      </article>

      <aside className="space-y-6">
        <MostRead posts={mostRead} />
        <AdSlot slot="article-sidebar" />
      </aside>
    </div>
  );
}
