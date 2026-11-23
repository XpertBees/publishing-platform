import { SeoSettings } from "../models/SeoSettings";
import { SiteSettings } from "../models/SiteSettings";
import { serializeSeoSettings, serializeSiteSettings } from "../utils/serializers";

/**
 * Single-row settings tables. The seeders create the initial row; these
 * services upsert it (find first row, else create with defaults).
 */
export const SeoService = {
  async get(): Promise<Record<string, unknown>> {
    const row = await SeoSettings.findOne({ order: [["updatedAt", "DESC"]] });
    if (!row) {
      const created = await SeoSettings.create({
        defaultDescription:
          "The Daily Pulse — lifestyle, personal finance, technology and breaking news.",
        defaultTitle: "The Daily Pulse",
        googleNewsEnabled: true,
      });
      return serializeSeoSettings(created.get({ plain: true }));
    }
    return serializeSeoSettings(row.get({ plain: true }));
  },

  async update(input: {
    defaultDescription?: string;
    defaultOgImage?: string;
    defaultTitle?: string;
    googleNewsEnabled?: boolean;
    robotsTxt?: string;
    twitterHandle?: string;
  }): Promise<Record<string, unknown>> {
    const row = await SeoSettings.findOne({ order: [["updatedAt", "DESC"]] });
    // Merge semantics: only fields present in the input are changed, so
    // partial (PATCH) bodies can never blank out required columns.
    const patch: Record<string, unknown> = {};
    if (input.defaultDescription !== undefined) patch.defaultDescription = input.defaultDescription;
    if (input.defaultTitle !== undefined) patch.defaultTitle = input.defaultTitle;
    if (input.googleNewsEnabled !== undefined) patch.googleNewsEnabled = input.googleNewsEnabled;
    if (input.defaultOgImage !== undefined) patch.defaultOgImage = input.defaultOgImage || null;
    if (input.twitterHandle !== undefined) patch.twitterHandle = input.twitterHandle || null;
    if (input.robotsTxt !== undefined) patch.robotsTxt = input.robotsTxt || null;
    if (!row) {
      const created = await SeoSettings.create({
        defaultDescription:
          input.defaultDescription ??
          "The Daily Pulse — lifestyle, personal finance, technology and breaking news.",
        defaultOgImage: input.defaultOgImage || null,
        defaultTitle: input.defaultTitle ?? "The Daily Pulse",
        googleNewsEnabled: input.googleNewsEnabled ?? true,
        robotsTxt: input.robotsTxt || null,
        twitterHandle: input.twitterHandle || null,
      });
      return serializeSeoSettings(created.get({ plain: true }));
    }
    await row.update(patch);
    return serializeSeoSettings(row.get({ plain: true }));
  },
};

export const SettingsService = {
  async get(): Promise<Record<string, unknown>> {
    const row = await SiteSettings.findOne({ order: [["updatedAt", "DESC"]] });
    if (!row) {
      const created = await SiteSettings.create({
        primaryColor: "#1d4ed8",
        siteName: "The Daily Pulse",
      });
      return serializeSiteSettings(created.get({ plain: true }));
    }
    return serializeSiteSettings(row.get({ plain: true }));
  },

  async update(input: {
    adsenseClientId?: string;
    faviconUrl?: string;
    gaMeasurementId?: string;
    logoUrl?: string;
    primaryColor?: string;
    siteName?: string;
    socialLinks?: Record<string, string>;
    tagline?: string;
  }): Promise<Record<string, unknown>> {
    const row = await SiteSettings.findOne({ order: [["updatedAt", "DESC"]] });
    // Merge semantics: only fields present in the input are changed (PATCH-safe).
    const patch: Record<string, unknown> = {};
    if (input.siteName !== undefined) patch.siteName = input.siteName;
    if (input.tagline !== undefined) patch.tagline = input.tagline || null;
    if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl || null;
    if (input.faviconUrl !== undefined) patch.faviconUrl = input.faviconUrl || null;
    if (input.primaryColor !== undefined) patch.primaryColor = input.primaryColor;
    if (input.adsenseClientId !== undefined) patch.adsenseClientId = input.adsenseClientId || null;
    if (input.gaMeasurementId !== undefined) patch.gaMeasurementId = input.gaMeasurementId || null;
    if (input.socialLinks !== undefined) patch.socialLinks = input.socialLinks;
    if (!row) {
      const created = await SiteSettings.create({
        adsenseClientId: input.adsenseClientId || null,
        faviconUrl: input.faviconUrl || null,
        gaMeasurementId: input.gaMeasurementId || null,
        logoUrl: input.logoUrl || null,
        primaryColor: input.primaryColor ?? "#1d4ed8",
        siteName: input.siteName ?? "The Daily Pulse",
        socialLinks: input.socialLinks ?? null,
        tagline: input.tagline || null,
      });
      return serializeSiteSettings(created.get({ plain: true }));
    }
    await row.update(patch);
    return serializeSiteSettings(row.get({ plain: true }));
  },
};
