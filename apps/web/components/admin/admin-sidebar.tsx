"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageSquare,
  Newspaper,
  Package,
  Rss,
  Search,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { ROLE_PERMISSIONS, type Permission, type User } from "@daily-pulse/shared";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  perm: Permission | null;
}

const NAV: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, perm: null },
  { label: "Posts", href: "/admin/posts", icon: FileText, perm: "posts.view" },
  { label: "Sponsored", href: "/admin/sponsored", icon: Megaphone, perm: "posts.view" },
  { label: "News & RSS", href: "/admin/news", icon: Newspaper, perm: "news.manage" },
  {
    label: "Categories & Tags",
    href: "/admin/categories",
    icon: FolderTree,
    perm: "categories.manage",
  },
  { label: "Media", href: "/admin/media", icon: Image, perm: "media.manage" },
  { label: "Authors", href: "/admin/authors", icon: Users, perm: "authors.manage" },
  { label: "Banners", href: "/admin/banners", icon: Megaphone, perm: "banners.manage" },
  { label: "Affiliates", href: "/admin/affiliates", icon: Link2, perm: "affiliates.manage" },
  { label: "Products", href: "/admin/products", icon: Package, perm: "products.manage" },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart, perm: "orders.view" },
  { label: "Newsletter", href: "/admin/newsletter", icon: Rss, perm: "newsletter.view" },
  { label: "Comments", href: "/admin/comments", icon: MessageSquare, perm: "comments.moderate" },
  { label: "SEO", href: "/admin/seo", icon: Search, perm: "seo.manage" },
  { label: "Redirects", href: "/admin/redirects", icon: Link2, perm: "redirects.manage" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, perm: "analytics.view" },
  { label: "Users & Roles", href: "/admin/users", icon: Users, perm: "users.manage" },
  { label: "Settings", href: "/admin/settings", icon: Settings, perm: "settings.manage" },
];

export function AdminSidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const perms = user ? ROLE_PERMISSIONS[user.role] : null;
  const visible = NAV.filter((item) => !item.perm || !perms || perms.includes(item.perm));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
      <div className="border-b border-neutral-200 px-5 py-4">
        <Link href="/admin" className="text-lg font-bold tracking-tight text-neutral-900">
          The Daily Pulse
        </Link>
        <p className="text-xs text-neutral-500">Admin</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin sections">
        <ul className="space-y-1">
          {visible.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-brand-50 text-brand-700" : "text-neutral-700 hover:bg-neutral-100",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {user ? (
        <div className="border-t border-neutral-200 px-5 py-3">
          <p className="truncate text-sm font-medium text-neutral-900">{user.name}</p>
          <p className="truncate text-xs text-neutral-500">
            {user.email} · {user.role}
          </p>
        </div>
      ) : null}
    </aside>
  );
}
