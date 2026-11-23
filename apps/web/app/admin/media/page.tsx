"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { adminApi, useAdminList } from "@/lib/admin-api";
import type { MediaItem } from "@daily-pulse/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const list = useAdminList<MediaItem>("/media", page);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setNotice("Choose a file to upload.");
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (altText.trim()) form.append("alt", altText.trim());
      await adminApi.upload("/media/upload", form);
      setAltText("");
      if (fileRef.current) fileRef.current.value = "";
      await list.refresh();
      setNotice("Upload complete.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const saveAlt = async () => {
    if (!editing) return;
    try {
      await adminApi.update(`/media/${editing._id}`, { alt: editAlt });
      setEditing(null);
      await list.refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save alt text.");
    }
  };

  const deleteItem = async (item: MediaItem) => {
    if (!window.confirm(`Delete "${item.filename}"?`)) return;
    await adminApi.remove(`/media/${item._id}`).catch((err: Error) => setNotice(err.message));
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader title="Media" description="Upload and manage images used across the site." />
      {notice ? (
        <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">{notice}</p>
      ) : null}

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-4 pt-5">
          <div>
            <Label htmlFor="media-file">File</Label>
            <input id="media-file" ref={fileRef} type="file" accept="image/*" className="text-sm" />
          </div>
          <FormField label="Alt text">
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image"
            />
          </FormField>
          <Button onClick={() => void upload()} disabled={uploading}>
            {uploading ? <Spinner className="h-4 w-4" /> : null}
            Upload
          </Button>
        </CardContent>
      </Card>

      {list.loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : list.error ? (
        <Card>
          <EmptyState title="Could not load media" description={list.error} />
        </Card>
      ) : list.items.length === 0 ? (
        <Card>
          <EmptyState title="No media yet" description="Upload your first image above." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.items.map((item) => (
              <Card key={item._id}>
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-neutral-100">
                  <Image
                    src={item.url}
                    alt={item.alt ?? item.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <CardContent className="space-y-1 pt-3">
                  <p
                    className="truncate text-sm font-medium text-neutral-900"
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatBytes(item.size)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                  </p>
                  <p className="truncate text-xs text-neutral-500" title={item.alt ?? ""}>
                    Alt: {item.alt || "—"}
                  </p>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      className="text-sm font-medium text-brand-600 hover:underline"
                      onClick={() => {
                        setEditing(item);
                        setEditAlt(item.alt ?? "");
                      }}
                    >
                      Edit alt
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() => void deleteItem(item)}
                    >
                      Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4">
            <Pagination page={page} totalPages={list.totalPages} onPage={setPage} />
          </Card>
        </>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Edit alt text">
        <div className="space-y-4">
          <FormField label="Alt text">
            <Input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} />
          </FormField>
          <Button onClick={() => void saveAlt()}>Save</Button>
        </div>
      </Dialog>
    </div>
  );
}
