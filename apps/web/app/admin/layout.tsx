import type { ReactNode } from "react";
import { cookies } from "next/headers";
import type { User } from "@daily-pulse/shared";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Resolve the logged-in user server-side for nav gating. The API is the
 *  authority; this is UI gating only. Returns null when unverifiable. */
async function getMe(): Promise<User | null> {
  const token = (await cookies()).get("dp_access")?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: { user?: User } | User };
    if (!json?.success) return null;
    const data = json.data;
    if (!data) return null;
    return "user" in data && data.user ? data.user : (data as User);
  } catch {
    return null;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getMe();
  return (
    <div className="flex min-h-screen bg-neutral-100">
      <AdminSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
