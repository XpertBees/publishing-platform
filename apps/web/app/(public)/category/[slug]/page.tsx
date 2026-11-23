import type { Metadata } from "next";
import Link from "next/link";
import { VERTICALS } from "@daily-pulse/shared";
import AdSlot from "@/components/ads/AdSlot";
import Breadcrumbs from "@/components/public/Breadcrumbs";
import MostRead from "@/components/public/MostRead";
import SectionHeader from "@/components/public/SectionHeader";
import StoryCard from "@/components/public/StoryCard";
import { getCategoryBySlug, getMostRead, getPostsByCategory } from "@/services/posts.service";
import { canonicalFor, SITE_NAME } from "@/lib/site";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    return VERTICALS.map((v) => ({ slug: v.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug).catch(() => null);
  const name =
    category?.name ?? VERTICALS.find((v) => v.slug === slug)?.name ?? slug.replace(/-/g, " ");
  const title = `${name} News`;
  return {
    title,
    description:
      category?.description ?? `Latest ${name} stories, guides and analysis from ${SITE_NAME}.`,
    alternates: { canonical: canonicalFor(`/category/${slug}`) },
    openGraph: { title, type: "website", url: canonicalFor(`/category/${slug}`) },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [category, feed, mostRead] = await Promise.all([
    getCategoryBySlug(slug),
    getPostsByCategory(slug, page, 10),
    getMostRead(5),
  ]);
  const name =
    category?.name ?? VERTICALS.find((v) => v.slug === slug)?.name ?? slug.replace(/-/g, " ");

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: name }]} />
        <header className="mb-6 border-b-2 border-neutral-900 pb-4">
          <h1 className="font-serif text-3xl font-bold text-neutral-900 md:text-4xl">{name}</h1>
          {category?.description ? (
            <p className="mt-2 text-neutral-600">{category.description}</p>
          ) : null}
        </header>
        <SectionHeader title={`Latest in ${name}`} />
        {feed.items.length > 0 ? (
          <div>
            {feed.items.map((post) => (
              <StoryCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
            No stories in this section yet — check back soon.
          </p>
        )}
        {feed.totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-6 flex items-center gap-2 text-sm">
            {page > 1 ? (
              <Link
                href={`/category/${slug}?page=${page - 1}`}
                className="rounded border border-neutral-300 px-3 py-1.5 font-semibold hover:bg-neutral-100"
              >
                ← Previous
              </Link>
            ) : null}
            <span className="text-neutral-500">
              Page {page} of {feed.totalPages}
            </span>
            {page < feed.totalPages ? (
              <Link
                href={`/category/${slug}?page=${page + 1}`}
                className="rounded border border-neutral-300 px-3 py-1.5 font-semibold hover:bg-neutral-100"
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
      <aside className="space-y-6">
        <MostRead posts={mostRead} />
        <AdSlot slot="category-sidebar" />
      </aside>
    </div>
  );
}
