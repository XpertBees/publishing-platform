"use client";

import { useViewPing } from "@/hooks/useViewPing";

export default function ViewPing({ postId, path }: { postId?: string; path?: string }) {
  useViewPing(postId, path);
  return null;
}
