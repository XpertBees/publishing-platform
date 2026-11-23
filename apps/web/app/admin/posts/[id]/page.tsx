"use client";

import { use, useEffect, useState } from "react";
import type { Post } from "@daily-pulse/shared";
import { adminApi } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PostForm } from "@/components/admin/post-form";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<Post>(`/posts/${id}`)
      .then((data) => {
        if (!cancelled) setPost(data);
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
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (error || !post) {
    return (
      <Card>
        <EmptyState title="Post not found" description={error ?? "This post does not exist."} />
      </Card>
    );
  }
  return (
    <div>
      <AdminPageHeader title="Edit post" description={post.title} />
      <PostForm initial={post} />
    </div>
  );
}
