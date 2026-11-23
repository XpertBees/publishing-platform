import { describe, expect, it } from "vitest";
import { slugify } from "@daily-pulse/shared";
import { categorySchema, loginSchema, postCreateSchema, rssSourceSchema } from "../src/validators";

describe("slugify (shared)", () => {
  it("lowercases, hyphenates and trims", () => {
    expect(slugify("Hello, World! On-Device AI")).toBe("hello-world-on-device-ai");
    expect(slugify("  Spaced  Title  ")).toBe("spaced-title");
    expect(slugify("PDRN & Rice — Glass Skin")).toBe("pdrn-rice-glass-skin");
  });

  it("caps at 120 chars", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(120);
  });
});

describe("postCreateSchema (shared, re-exported)", () => {
  const valid = {
    category: "technology",
    postType: "editorial",
    tags: ["ai"],
    title: "Hello",
  };

  it("accepts a minimal valid post and applies defaults", () => {
    const parsed = postCreateSchema.parse(valid);
    expect(parsed.status).toBe("draft");
    expect(parsed.ctaLabel).toBe("Read More");
    expect(parsed.language).toBe("en");
    expect(parsed.gallery).toEqual([]);
  });

  it("rejects an empty title and an unknown postType", () => {
    expect(() => postCreateSchema.parse({ ...valid, title: "" })).toThrow();
    expect(() => postCreateSchema.parse({ ...valid, postType: "nope" })).toThrow();
  });

  it("rejects a bad externalUrl", () => {
    expect(() => postCreateSchema.parse({ ...valid, externalUrl: "not-a-url" })).toThrow();
  });
});

describe("other shared schemas", () => {
  it("loginSchema requires a valid email", () => {
    expect(loginSchema.parse({ email: "a@example.com", password: "x" })).toBeTruthy();
    expect(() => loginSchema.parse({ email: "nope", password: "x" })).toThrow();
  });

  it("categorySchema requires name and slug", () => {
    expect(() => categorySchema.parse({ name: "Tech" })).toThrow();
    expect(categorySchema.parse({ name: "Tech", slug: "technology" }).isVertical).toBe(false);
  });

  it("rssSourceSchema enforces a 5–1440 minute fetch interval", () => {
    expect(
      rssSourceSchema.parse({
        category: "breaking-news",
        name: "ET",
        url: "https://example.com/rss",
      }).fetchIntervalMinutes,
    ).toBe(15);
    expect(() =>
      rssSourceSchema.parse({
        category: "breaking-news",
        fetchIntervalMinutes: 1,
        name: "ET",
        url: "https://example.com/rss",
      }),
    ).toThrow();
  });
});
