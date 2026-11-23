import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/public/Breadcrumbs";
import MostRead from "@/components/public/MostRead";
import SectionHeader from "@/components/public/SectionHeader";
import StoryCard from "@/components/public/StoryCard";
import { getMostRead, getPostsByTag } from "@/services/posts.service";
import { canonicalFor, SITE_NAME } from "@/lib/site";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const label = decodeURIComponent(tag);
  return {
    title: `#${label} — ${SITE_NAME}`,
    description: `Stories tagged “${label}” on ${SITE_NAME}.`,
    alternates: { canonical: canonicalFor(`/tag/${tag}`) },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tag } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const label = decodeURIComponent(tag);
  const [feed, mostRead] = await Promise.all([getPostsByTag(label, page, 10), getMostRead(5)]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `#${label}` }]} />
        <h1 className="mb-6 font-serif text-3xl font-bold text-neutral-900">#{label}</h1>
        <SectionHeader title={`${feed.total} ${feed.total === 1 ? "story" : "stories"}`} />
        {feed.items.length > 0 ? (
          <div>
            {feed.items.map((post) => (
              <StoryCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
            No stories tagged “{label}” yet.
          </p>
        )}
        {feed.totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-6 flex items-center gap-2 text-sm">
            {page > 1 ? (
              <Link
                href={`/tag/${tag}?page=${page - 1}`}
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
                href={`/tag/${tag}?page=${page + 1}`}
                className="rounded border border-neutral-300 px-3 py-1.5 font-semibold hover:bg-neutral-100"
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
      <aside>
        <MostRead posts={mostRead} />
      </aside>
    </div>
  );
}
