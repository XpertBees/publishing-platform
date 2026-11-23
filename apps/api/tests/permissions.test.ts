import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, type Permission, type Role } from "@daily-pulse/shared";
import { roleHasPermission } from "../src/middleware/auth";

describe("ROLE_PERMISSIONS (shared contract)", () => {
  it("super_admin holds every permission", () => {
    const all = Object.values(ROLE_PERMISSIONS).flat();
    for (const permission of new Set(all)) {
      expect(ROLE_PERMISSIONS.super_admin).toContain(permission);
    }
  });

  it("admin holds everything except users.manage", () => {
    expect(ROLE_PERMISSIONS.admin).not.toContain("users.manage");
    expect(ROLE_PERMISSIONS.admin).toContain("posts.publish");
    expect(ROLE_PERMISSIONS.admin).toContain("settings.manage");
  });

  it("author cannot publish or manage categories", () => {
    expect(ROLE_PERMISSIONS.author).not.toContain("posts.publish");
    expect(ROLE_PERMISSIONS.author).not.toContain("categories.manage");
    expect(ROLE_PERMISSIONS.author).toContain("posts.create");
  });

  it("analyst is read-only on analytics", () => {
    expect(ROLE_PERMISSIONS.analyst).toContain("analytics.view");
    expect(ROLE_PERMISSIONS.analyst).not.toContain("posts.create");
  });
});

describe("roleHasPermission", () => {
  it("returns true for a granted permission", () => {
    expect(roleHasPermission("editor", "posts.publish")).toBe(true);
    expect(roleHasPermission("news_editor", "rss.manage")).toBe(true);
    expect(roleHasPermission("seo_manager", "redirects.manage")).toBe(true);
  });

  it("returns false for a missing permission", () => {
    expect(roleHasPermission("author", "posts.delete")).toBe(false);
    expect(roleHasPermission("marketing_manager", "seo.manage")).toBe(false);
  });

  it("is exhaustive: every role/permission pair resolves to a boolean", () => {
    const roles = Object.keys(ROLE_PERMISSIONS) as Role[];
    const permissions = [...new Set(Object.values(ROLE_PERMISSIONS).flat())] as Permission[];
    for (const role of roles) {
      for (const permission of permissions) {
        expect(typeof roleHasPermission(role, permission)).toBe("boolean");
      }
    }
  });
});
