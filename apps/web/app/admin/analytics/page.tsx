"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyticsEvent, OverviewStats } from "@daily-pulse/shared";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [topPosts, setTopPosts] = useState<OverviewStats["topPosts"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi.list<AnalyticsEvent>("/analytics/events?pageSize=500"),
      adminApi.get<OverviewStats>("/admin/overview"),
    ])
      .then(([eventPage, overview]) => {
        if (cancelled) return;
        setEvents(eventPage.items);
        setTopPosts(overview.topPosts);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const key = dayKey(event.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  }, [events]);

  const maxDay = byDay.reduce((max, [, count]) => Math.max(max, count), 0);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Analytics" description="Views and events over the last 14 days." />
      {error ? (
        <Card className="mb-4">
          <EmptyState title="Could not load analytics" description={error} />
        </Card>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events by day</CardTitle>
          </CardHeader>
          <CardContent>
            {byDay.length === 0 ? (
              <EmptyState
                title="No events yet"
                description="Page views and clicks will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {byDay.map(([day, count]) => (
                  <li key={day} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 font-mono text-xs text-neutral-600">{day}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-neutral-100">
                      <div
                        className="h-full rounded bg-brand-600"
                        style={{ width: `${maxDay ? (count / maxDay) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right font-medium text-neutral-900">
                      {count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top posts</CardTitle>
          </CardHeader>
          {topPosts.length === 0 ? (
            <EmptyState
              title="No top posts yet"
              description="Views will appear here once posts are read."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Views</TH>
                </TR>
              </THead>
              <TBody>
                {topPosts.map((post) => (
                  <TR key={post.slug}>
                    <TD>{post.title}</TD>
                    <TD>{post.views.toLocaleString()}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
