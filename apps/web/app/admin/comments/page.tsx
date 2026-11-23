"use client";

import { useState } from "react";
import type { Comment } from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

const MODERATION_ACTIONS = ["approved", "spam", "rejected"] as const;

export default function CommentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actingId, setActingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const list = useAdminList<Comment>(
    statusFilter ? `/comments?status=${statusFilter}` : "/comments",
    page,
  );

  const moderate = async (comment: Comment, status: string) => {
    setActingId(comment._id);
    setNotice(null);
    try {
      await adminApi.update(`/comments/${comment._id}`, { status });
      await list.refresh();
      setNotice(`Comment marked as ${status}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Moderation failed.");
    } finally {
      setActingId(null);
    }
  };

  const deleteComment = async (comment: Comment) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    await adminApi.remove(`/comments/${comment._id}`).catch((err: Error) => setNotice(err.message));
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Comments"
        description="Moderate reader comments before they go live."
      />
      {notice ? (
        <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">{notice}</p>
      ) : null}
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
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="spam">Spam</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load comments" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No comments here" description="Try a different status filter." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Author</TH>
                  <TH>Comment</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((comment) => (
                  <TR key={comment._id}>
                    <TD>
                      <span className="font-medium">{comment.authorName}</span>
                      {comment.authorEmail ? (
                        <span className="block text-xs text-neutral-500">
                          {comment.authorEmail}
                        </span>
                      ) : null}
                    </TD>
                    <TD className="max-w-md">{comment.body}</TD>
                    <TD>
                      <StatusBadge status={comment.status} />
                    </TD>
                    <TD>{new Date(comment.createdAt).toLocaleDateString()}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        {MODERATION_ACTIONS.map((action) => (
                          <Button
                            key={action}
                            variant="outline"
                            size="sm"
                            disabled={actingId === comment._id || comment.status === action}
                            onClick={() => void moderate(comment, action)}
                          >
                            {action === "approved"
                              ? "Approve"
                              : action === "spam"
                                ? "Spam"
                                : "Reject"}
                          </Button>
                        ))}
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteComment(comment)}
                        >
                          Delete
                        </button>
                      </div>
                    </TD>
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
