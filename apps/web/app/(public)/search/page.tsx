import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/public/Breadcrumbs";
import SearchBox from "@/components/public/SearchBox";
import SectionHeader from "@/components/public/SectionHeader";
import StoryCard from "@/components/public/StoryCard";
import { searchPosts } from "@/services/posts.service";
import { canonicalFor, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  return {
    title: query ? `Search: ${query} — ${SITE_NAME}` : `Search — ${SITE_NAME}`,
    description: query ? `Search results for “${query}” on ${SITE_NAME}.` : `Search ${SITE_NAME}.`,
    alternates: {
      canonical: canonicalFor(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const feed = query ? await searchPosts(query, page, 10) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <h1 className="font-serif text-3xl font-bold text-neutral-900">Search</h1>
      <div className="mt-4 max-w-md">
        <SearchBox />
      </div>
      {query ? (
        <div className="mt-8">
          <SectionHeader
            title={
              feed
                ? `${feed.total} ${feed.total === 1 ? "result" : "results"} for “${query}”`
                : `Results for “${query}”`
            }
          />
          {feed && feed.items.length > 0 ? (
            <div>
              {feed.items.map((post) => (
                <StoryCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
              No results for “{query}”. Try a different keyword.
            </p>
          )}
          {feed && feed.totalPages > 1 ? (
            <nav aria-label="Pagination" className="mt-6 flex items-center gap-2 text-sm">
              {page > 1 ? (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
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
                  href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                  className="rounded border border-neutral-300 px-3 py-1.5 font-semibold hover:bg-neutral-100"
                >
                  Next →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 text-sm text-neutral-500">Type a keyword above to search our stories.</p>
      )}
    </div>
  );
}
