import type { Post } from "@daily-pulse/shared";
import SectionHeader from "./SectionHeader";
import StoryCard from "./StoryCard";

export default function RelatedArticles({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-label="Related articles" className="mt-10">
      <SectionHeader title="Related Articles" />
      <div className="grid gap-2 sm:grid-cols-2">
        {posts.map((post) => (
          <StoryCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}
