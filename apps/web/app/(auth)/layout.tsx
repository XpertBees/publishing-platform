import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4">
      <div className="mb-6 text-center">
        <p className="text-2xl font-bold tracking-tight text-neutral-900">The Daily Pulse</p>
        <p className="mt-1 text-sm text-neutral-500">Publishing admin</p>
      </div>
      {children}
    </div>
  );
}
