"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex w-full max-w-xs items-center gap-2 rounded border border-neutral-300 bg-white px-2 py-1.5"
    >
      <label htmlFor="site-search" className="sr-only">
        Search articles
      </label>
      <input
        id="site-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search news…"
        className="min-w-0 flex-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
      />
      <button type="submit" aria-label="Search" className="text-neutral-500 hover:text-brand-600">
        <Search className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
