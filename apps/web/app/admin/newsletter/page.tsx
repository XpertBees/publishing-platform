"use client";

import { useState } from "react";
import type { NewsletterSubscriber } from "@daily-pulse/shared";
import { useAdminList } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewsletterPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const list = useAdminList<NewsletterSubscriber>(
    statusFilter ? `/newsletter?status=${statusFilter}` : "/newsletter",
    page,
  );

  const exportCsv = () => {
    const rows = [["email", "status", "source", "createdAt"]];
    for (const sub of list.items) {
      rows.push([sub.email, sub.status, sub.source ?? "", sub.createdAt]);
    }
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description="Subscriber list and exports."
        action={
          <Button variant="outline" onClick={exportCsv} disabled={list.items.length === 0}>
            Export CSV (this page)
          </Button>
        }
      />
      <Card>
        <div className="border-b border-neutral-200 px-4 py-3">
          <Select
            className="w-48"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All subscribers</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </Select>
        </div>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load subscribers" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No subscribers yet" description="Sign-ups will appear here." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Email</TH>
                  <TH>Status</TH>
                  <TH>Source</TH>
                  <TH>Subscribed</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((sub) => (
                  <TR key={sub._id}>
                    <TD className="font-medium">{sub.email}</TD>
                    <TD>
                      {sub.status === "subscribed" ? (
                        <Badge tone="green">Subscribed</Badge>
                      ) : (
                        <Badge tone="neutral">Unsubscribed</Badge>
                      )}
                    </TD>
                    <TD>{sub.source ?? "—"}</TD>
                    <TD>{new Date(sub.createdAt).toLocaleDateString()}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={list.totalPages} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
