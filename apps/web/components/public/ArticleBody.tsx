import Image from "next/image";
import type { Post } from "@daily-pulse/shared";

export interface BodyBlock {
  type: "paragraph" | "heading" | "quote" | "image" | "list";
  text?: string;
  level?: number;
  url?: string;
  alt?: string;
  caption?: string;
  items?: string[];
}

export function parseBody(body: unknown): BodyBlock[] {
  if (!Array.isArray(body)) return [];
  return body.filter(
    (b): b is BodyBlock =>
      typeof b === "object" &&
      b !== null &&
      ["paragraph", "heading", "quote", "image", "list"].includes(
        (b as { type?: unknown }).type as string,
      ),
  ) as BodyBlock[];
}

/**
 * Renders structured JSON body blocks as plain React — no
 * dangerouslySetInnerHTML, so untrusted content cannot inject markup.
 */
export default function ArticleBody({ post }: { post: Post }) {
  const blocks = parseBody(post.body);
  if (blocks.length === 0) {
    return post.summary ? (
      <p className="text-lg leading-relaxed text-neutral-700">{post.summary}</p>
    ) : null;
  }
  return (
    <div className="space-y-5 text-lg leading-relaxed text-neutral-800">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return block.level === 3 ? (
              <h3 key={i} className="font-serif text-2xl font-bold text-neutral-900">
                {block.text}
              </h3>
            ) : (
              <h2 key={i} className="font-serif text-2xl font-bold text-neutral-900 md:text-3xl">
                {block.text}
              </h2>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-brand-600 pl-4 font-serif text-xl text-neutral-700 italic"
              >
                {block.text}
              </blockquote>
            );
          case "image":
            return block.url ? (
              <figure key={i}>
                <span className="relative block aspect-[16/9] overflow-hidden rounded-lg">
                  <Image
                    src={block.url}
                    alt={block.alt ?? ""}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </span>
                {block.caption ? (
                  <figcaption className="mt-2 text-center text-sm text-neutral-500">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null;
          case "list":
            return (
              <ul key={i} className="list-disc space-y-2 pl-6">
                {(block.items ?? []).map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          default:
            return <p key={i}>{block.text}</p>;
        }
      })}
    </div>
  );
}
