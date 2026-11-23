import type { Metadata } from "next";
import Link from "next/link";
import { VERTICALS } from "@daily-pulse/shared";
import AdSlot from "@/components/ads/AdSlot";
import HeroStory from "@/components/public/HeroStory";
import MostRead from "@/components/public/MostRead";
import NewsletterForm from "@/components/public/NewsletterForm";
import SectionHeader from "@/components/public/SectionHeader";
import StoryCard from "@/components/public/StoryCard";
import { getHomeFeed, getMostRead, getPostsByCategory } from "@/services/posts.service";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
      No {label} stories yet — check back soon.
    </p>
  );
}

export default async function HomePage() {
  const [feed, mostRead] = await Promise.all([getHomeFeed(20), getMostRead(5)]);
  const items = feed.items;
  const [lead, ...rest] = items;
  const secondary = rest.slice(0, 4);
  const latest = rest.slice(4, 12);
  const sections = await Promise.all(
    VERTICALS.map(async (v) => ({
      vertical: v,
      posts: (await getPostsByCategory(v.slug, 1, 4)).items,
    })),
  );

  return (
    <div className="space-y-10">
      {/* Hero + secondary */}
      <section aria-label="Top stories" className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {lead ? <HeroStory post={lead} /> : <EmptyState label="top" />}
          {secondary.length > 0 ? (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {secondary.map((post) => (
                <StoryCard key={post._id} post={post} />
              ))}
            </div>
          ) : null}
        </div>
        <aside className="space-y-6">
          <MostRead posts={mostRead} />
          <AdSlot slot="home-sidebar" />
        </aside>
      </section>

      <AdSlot slot="home-leaderboard" />

      {/* Latest news */}
      <section aria-label="Latest news">
        <SectionHeader title="Latest News" href="/category/breaking-news" />
        {latest.length > 0 ? (
          <div className="grid gap-x-8 md:grid-cols-2">
            {latest.map((post) => (
              <StoryCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState label="latest" />
        )}
      </section>

      {/* One section per vertical */}
      {sections.map(({ vertical, posts }) => (
        <section key={vertical.slug} aria-label={vertical.name}>
          <SectionHeader title={vertical.name} href={`/category/${vertical.slug}`} />
          {posts.length > 0 ? (
            <div className="grid gap-x-8 md:grid-cols-2">
              {posts.map((post) => (
                <StoryCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState label={vertical.name} />
          )}
        </section>
      ))}

      {/* Newsletter */}
      <section
        aria-label="Newsletter signup"
        className="rounded-lg bg-brand-900 px-6 py-8 text-white md:px-10"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">
            The Daily Pulse, in your inbox
          </h2>
          <p className="mt-2 text-sm text-brand-100">
            The day&apos;s top stories across lifestyle, money, tech and breaking news — every
            morning, free.
          </p>
          <div className="mt-5">
            <NewsletterForm source="home" />
          </div>
          <p className="mt-3 text-xs text-brand-100">
            <Link href="/newsletter" className="underline">
              More about the newsletter
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
