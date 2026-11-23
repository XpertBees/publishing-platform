"use client";

import { useEffect, useState } from "react";
import type { OverviewStats } from "@daily-pulse/shared";
import { adminApi } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<OverviewStats>("/admin/overview")
      .then((data) => {
        if (!cancelled) setStats(data);
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <EmptyState
          title="Overview unavailable"
          description={error ?? "The overview endpoint did not return data."}
        />
      </Card>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="Site health, content and revenue at a glance."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total posts" value={stats.totalPosts} />
        <StatCard label="Published" value={stats.publishedPosts} />
        <StatCard label="Drafts" value={stats.draftPosts} />
        <StatCard label="Scheduled" value={stats.scheduledPosts} />
        <StatCard label="News items" value={stats.totalNewsItems} />
        <StatCard label="RSS sources active" value={stats.rssSourcesActive} />
        <StatCard label="Total views" value={stats.totalViews.toLocaleString()} />
        <StatCard label="Affiliate clicks" value={stats.affiliateClicks.toLocaleString()} />
        <StatCard label="Subscribers" value={stats.newsletterSubscribers.toLocaleString()} />
        <StatCard label="Product sales" value={stats.productSales} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top posts</CardTitle>
          </CardHeader>
          {stats.topPosts.length === 0 ? (
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
                {stats.topPosts.map((post) => (
                  <TR key={post.slug}>
                    <TD>{post.title}</TD>
                    <TD>{post.views.toLocaleString()}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          {stats.recentActivity.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Admin actions will be listed here."
            />
          ) : (
            <ul className="divide-y divide-neutral-200 px-5 py-2">
              {stats.recentActivity.slice(0, 10).map((entry) => (
                <li key={entry._id} className="py-2 text-sm">
                  <span className="font-medium text-neutral-900">{entry.action}</span>{" "}
                  <span className="text-neutral-500">
                    {entry.entity}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                  </span>
                  <span className="block text-xs text-neutral-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
