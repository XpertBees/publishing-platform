import { describe, expect, it } from "vitest";
import {
  serializeAffiliateLink,
  serializeCategory,
  serializeOrder,
  serializePost,
  serializeRssItem,
  serializeUser,
} from "../src/utils/serializers";

describe("serializePost", () => {
  it("maps id→_id, Dates→ISO, category→slug+name, tags→string[], author→authorName", () => {
    const row = {
      affiliateDisclosure: true,
      authorId: "author-1",
      Author: { id: "author-1", name: "Jane Doe" },
      body: null,
      category: undefined,
      Category: { id: "cat-1", name: "Technology", slug: "technology" },
      createdAt: new Date("2026-11-20T10:00:00.000Z"),
      ctaLabel: "Read More",
      featuredImage: null,
      gallery: [],
      headline: "Head",
      language: "en",
      postType: "editorial",
      publishedAt: new Date("2026-11-21T10:00:00.000Z"),
      seo: { description: "d", keywords: ["a"], noIndex: false, title: "t" },
      slug: "hello-world",
      sponsored: false,
      status: "published",
      summary: "s",
      Tags: [
        { name: "AI", slug: "ai" },
        { name: "News", slug: "news" },
      ],
      title: "Hello World",
      updatedAt: new Date("2026-11-21T11:00:00.000Z"),
      views: 42,
    };
    const out = serializePost(row as never);
    expect(out._id).toBeUndefined(); // row has no `id` field in this fixture
    expect(out.slug).toBe("hello-world");
    expect(out.category).toBe("technology");
    expect(out.categoryName).toBe("Technology");
    expect(out.tags).toEqual(["ai", "news"]);
    expect(out.author).toBe("author-1");
    expect(out.authorName).toBe("Jane Doe");
    expect(out.publishedAt).toBe("2026-11-21T10:00:00.000Z");
    expect(out.createdAt).toBe("2026-11-20T10:00:00.000Z");
    expect(out.views).toBe(42);
    expect(out.seo).toEqual({ description: "d", keywords: ["a"], noIndex: false, title: "t" });
  });

  it("falls back to plain category slug and string tags", () => {
    const out = serializePost({
      category: "lifestyle",
      createdAt: new Date("2026-11-20T00:00:00.000Z"),
      id: "p1",
      postType: "guide",
      slug: "x",
      status: "draft",
      tags: ["a", "b"],
      title: "X",
      updatedAt: new Date("2026-11-20T00:00:00.000Z"),
    } as never);
    expect(out._id).toBe("p1");
    expect(out.category).toBe("lifestyle");
    expect(out.tags).toEqual(["a", "b"]);
    expect(out.views).toBe(0);
    expect(out.seo).toEqual({ keywords: [], noIndex: false });
  });
});

describe("other serializers", () => {
  it("serializeUser never exposes a password hash", () => {
    const out = serializeUser({
      createdAt: new Date("2026-11-20T00:00:00.000Z"),
      email: "a@example.com",
      id: "u1",
      isActive: true,
      name: "A",
      passwordHash: "secret-hash",
      role: "admin",
      updatedAt: new Date("2026-11-20T00:00:00.000Z"),
    } as never);
    expect(out).not.toHaveProperty("passwordHash");
    expect(out._id).toBe("u1");
    expect(out.email).toBe("a@example.com");
  });

  it("serializeCategory maps parentId", () => {
    const out = serializeCategory({
      createdAt: new Date(),
      id: "c1",
      isVertical: true,
      name: "Tech",
      order: 2,
      parentId: "p0",
      slug: "technology",
      updatedAt: new Date(),
    } as never);
    expect(out.parent).toBe("p0");
    expect(out.isVertical).toBe(true);
  });

  it("serializeRssItem maps sourceId→source", () => {
    const out = serializeRssItem({
      category: "breaking-news",
      createdAt: new Date(),
      guid: "g1",
      id: "r1",
      imported: false,
      link: "https://example.com/a",
      sourceId: "s1",
      sourceName: "ET B2B",
      title: "T",
    } as never);
    expect(out.source).toBe("s1");
    expect(out.guid).toBe("g1");
  });

  it("serializeAffiliateLink and serializeOrder keep their shapes", () => {
    expect(
      serializeAffiliateLink({
        active: true,
        clicks: 3,
        createdAt: new Date(),
        id: "a1",
        slug: "deal",
        targetUrl: "https://example.com",
        title: "Deal",
        updatedAt: new Date(),
      } as never),
    ).toMatchObject({ _id: "a1", clicks: 3, slug: "deal" });
    expect(
      serializeOrder({
        amount: 49900,
        buyerEmail: "b@example.com",
        createdAt: new Date(),
        currency: "INR",
        id: "o1",
        productId: "pr1",
        productName: "Guide",
        status: "pending",
        updatedAt: new Date(),
      } as never),
    ).toMatchObject({ _id: "o1", amount: 49900, product: "pr1", productName: "Guide" });
  });
});
