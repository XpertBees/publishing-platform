"use client";

import { useEffect, useRef } from "react";
import { API_URL } from "@/lib/api";

/**
 * Fire-and-forget page-view ping. Never blocks render and never throws:
 * failures are swallowed silently.
 */
export function useViewPing(postId?: string, path?: string) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const url = `${API_URL}/analytics/events`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view", post: postId, path }),
      keepalive: true,
    }).catch(() => {
      /* analytics must never break the page */
    });
  }, [postId, path]);
}

export default useViewPing;
