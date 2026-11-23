/**
 * Seed script — idempotent. Creates the 4 content verticals, the default
 * RSS source (Economic Times B2B feed), default SEO/site settings, a super
 * admin user (credentials ONLY via env) and a few original sample posts.
 *
 * Run:  npm run seed --workspace=apps/api
 * (Assumes migrations have run: npm run db:migrate --workspace=apps/api)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "./config/database";
import { Author } from "./models/Author";
import { Category } from "./models/Category";
import { Post } from "./models/Post";
import { RssSource } from "./models/RssSource";
import { SeoSettings } from "./models/SeoSettings";
import { SiteSettings } from "./models/SiteSettings";
import { User } from "./models/User";

const VERTICALS = [
  {
    description: "Wellness, travel, food and everyday living.",
    name: "Lifestyle",
    slug: "lifestyle",
  },
  {
    description: "Money, markets, tax and personal finance.",
    name: "Personal Finance",
    slug: "personal-finance",
  },
  {
    description: "Gadgets, AI, startups and the future of tech.",
    name: "Technology",
    slug: "technology",
  },
  {
    description: "Developing stories as they happen.",
    name: "Breaking News",
    slug: "breaking-news",
  },
];

const SAMPLE_POSTS: { category: string; summary: string; title: string }[] = [
  {
    category: "lifestyle",
    summary: "Small, repeatable habits that compound into a calmer, healthier daily routine.",
    title: "The Slow Morning: Five Habits Worth Keeping",
  },
  {
    category: "personal-finance",
    summary: "A plain-language starter guide to building an emergency fund before you invest.",
    title: "Before You Invest: Build Your Emergency Fund First",
  },
  {
    category: "technology",
    summary: "What on-device AI actually changes for everyday users — and what it does not.",
    title: "On-Device AI, Explained Without the Hype",
  },
  {
    category: "breaking-news",
    summary:
      "Markets, weather and the stories developing through the day — updated as they happen.",
    title: "Today in Brief: What to Watch",
  },
];

async function main() {
  await sequelize.authenticate();

  for (const [i, v] of VERTICALS.entries()) {
    await Category.findOrCreate({
      defaults: { ...v, isVertical: true, order: i },
      where: { slug: v.slug },
    });
  }

  await RssSource.findOrCreate({
    defaults: {
      active: true,
      category: "breaking-news",
      fetchIntervalMinutes: 15,
      name: "Economic Times — B2B",
      url: "https://b2b.economictimes.indiatimes.com/rss",
    },
    where: { url: "https://b2b.economictimes.indiatimes.com/rss" },
  });

  await SeoSettings.findOrCreate({
    defaults: {
      defaultDescription:
        "The Daily Pulse — original reporting and curated news across lifestyle, personal finance, technology and breaking news.",
      defaultTitle: "The Daily Pulse — Lifestyle, Finance, Technology & Breaking News",
      googleNewsEnabled: true,
    },
    where: { id: "default" },
  });

  await SiteSettings.findOrCreate({
    defaults: { siteName: "The Daily Pulse", tagline: "News that keeps pace with your day." },
    where: { id: "default" },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const [admin] = await User.findOrCreate({
      defaults: {
        email: adminEmail,
        name: process.env.SEED_ADMIN_NAME ?? "Super Admin",
        passwordHash,
        role: "super_admin",
      },
      where: { email: adminEmail },
    });
    await Author.findOrCreate({
      defaults: {
        bio: "Editor-in-chief of The Daily Pulse.",
        name: admin.name,
        role: "Editor-in-Chief",
        slug: "editor-in-chief",
        userId: admin.id,
      },
      where: { slug: "editor-in-chief" },
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping super admin creation.");
  }

  const author = await Author.findOne({ where: { slug: "editor-in-chief" } });
  for (const sample of SAMPLE_POSTS) {
    const category = await Category.findOne({ where: { slug: sample.category } });
    if (!category) continue;
    const slug = sample.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    await Post.findOrCreate({
      defaults: {
        authorId: author?.id ?? null,
        body: [{ text: sample.summary, type: "paragraph" }],
        categoryId: category.id,
        language: "en",
        postType: "editorial",
        publishedAt: new Date(),
        slug,
        status: "published",
        summary: sample.summary,
        title: sample.title,
      },
      where: { slug },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  await sequelize.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
