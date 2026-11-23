"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POST_STATUSES, type Post } from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export function PostsTable({ sponsoredOnly = false }: { sponsoredOnly?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = sponsoredOnly
    ? `/posts?sponsored=true${status ? `&status=${status}` : ""}`
    : `/posts${status ? `?status=${status}` : ""}`;
  const { items, totalPages, loading, error, refresh } = useAdminList<Post>(query, page);

  const onDelete = async (post: Post) => {
    if (!window.confirm(`Delete post "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post._id);
    try {
      await adminApi.remove(`/posts/${post._id}`);
      await refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-3">
        <Select
          className="w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {POST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        {!sponsoredOnly ? (
          <Button onClick={() => router.push("/admin/posts/new")}>New post</Button>
        ) : null}
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <EmptyState title="Could not load posts" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No posts found"
          description="Try a different status filter or create a new post."
        />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Category</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Views</TH>
                <TH>Updated</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((post) => (
                <TR key={post._id}>
                  <TD className="font-medium">
                    {post.title}
                    {post.sponsored ? (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        Sponsored
                      </span>
                    ) : null}
                  </TD>
                  <TD>{post.categoryName ?? post.category}</TD>
                  <TD>{post.postType}</TD>
                  <TD>
                    <StatusBadge status={post.status} />
                  </TD>
                  <TD>{post.views.toLocaleString()}</TD>
                  <TD>{new Date(post.updatedAt).toLocaleDateString()}</TD>
                  <TD>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/posts/${post._id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                        disabled={deletingId === post._id}
                        onClick={() => void onDelete(post)}
                      >
                        Delete
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </Card>
  );
}
