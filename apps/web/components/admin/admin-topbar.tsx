"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { User } from "@daily-pulse/shared";
import { Button } from "@/components/ui/button";

export function AdminTopbar({ user }: { user: User | null }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-5">
      <p className="text-sm font-medium text-neutral-700 md:hidden">The Daily Pulse — Admin</p>
      <p className="hidden text-sm text-neutral-500 md:block">
        {user ? `Signed in as ${user.name} (${user.role})` : "Admin"}
      </p>
      <Button variant="ghost" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </header>
  );
}
