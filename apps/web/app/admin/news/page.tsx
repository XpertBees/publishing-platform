"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  rssSourceSchema,
  type RssItem,
  type RssSource,
  type RssSourceInput,
} from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

function SourceForm({ initial, onDone }: { initial?: RssSource; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RssSourceInput>({
    resolver: zodResolver(rssSourceSchema),
    defaultValues: {
      name: initial?.name ?? "",
      url: initial?.url ?? "",
      category: initial?.category ?? "",
      active: initial?.active ?? true,
      fetchIntervalMinutes: initial?.fetchIntervalMinutes ?? 15,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ _id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    adminApi
      .list<{ _id: string; name: string; slug: string }>("/categories?pageSize=100")
      .then((r) => setCategories(r.items))
      .catch(() => undefined);
  }, []);

  const onSubmit = async (values: RssSourceInput) => {
    setError(null);
    try {
      if (initial) await adminApi.update(`/rss/sources/${initial._id}`, values);
      else await adminApi.create("/rss/sources", values);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save source.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Name" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>
      <FormField label="Feed URL" error={errors.url?.message}>
        <Input {...register("url")} placeholder="https://example.com/feed.xml" />
      </FormField>
      <FormField label="Category" error={errors.category?.message}>
        <Select {...register("category")}>
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Fetch interval (minutes)" error={errors.fetchIntervalMinutes?.message}>
        <Input
          type="number"
          min={5}
          max={1440}
          {...register("fetchIntervalMinutes", { valueAsNumber: true })}
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4" />
        Active
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Add source"}
      </Button>
    </form>
  );
}

export default function NewsPage() {
  const [page, setPage] = useState(1);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RssSource | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const items = useAdminList<RssItem>("/rss/items", page);
  const sources = useAdminList<RssSource>("/rss/sources", 1, 100);

  const importItem = async (item: RssItem) => {
    setImportingId(item._id);
    setNotice(null);
    try {
      await adminApi.action(`/rss/items/${item._id}/import`);
      setNotice(`Imported "${item.title}" as a draft post.`);
      await items.refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImportingId(null);
    }
  };

  const fetchNow = async (source: RssSource) => {
    setFetchingId(source._id);
    try {
      await adminApi.action(`/rss/sources/${source._id}/fetch`);
      await sources.refresh();
      await items.refresh();
      setNotice(`Fetch started for ${source.name}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Fetch failed.");
    } finally {
      setFetchingId(null);
    }
  };

  const deleteSource = async (source: RssSource) => {
    if (!window.confirm(`Delete RSS source "${source.name}"?`)) return;
    await adminApi.remove(`/rss/sources/${source._id}`).catch((err: Error) => {
      setNotice(err.message);
    });
    await sources.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="News & RSS"
        description="Aggregated news items and the feeds they come from."
      />
      {notice ? (
        <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">{notice}</p>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>RSS items</CardTitle>
            <span className="text-sm text-neutral-500">Import an item to create a draft post.</span>
          </div>
        </CardHeader>
        {items.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : items.error ? (
          <EmptyState title="Could not load RSS items" description={items.error} />
        ) : items.items.length === 0 ? (
          <EmptyState
            title="No RSS items yet"
            description="Fetch a source to pull in news items."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Source</TH>
                  <TH>Category</TH>
                  <TH>Published</TH>
                  <TH>Status</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {items.items.map((item) => (
                  <TR key={item._id}>
                    <TD className="font-medium">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {item.title}
                      </a>
                    </TD>
                    <TD>{item.sourceName}</TD>
                    <TD>{item.category}</TD>
                    <TD>
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "—"}
                    </TD>
                    <TD>
                      {item.imported ? (
                        <Badge tone="green">Imported</Badge>
                      ) : (
                        <Badge tone="amber">New</Badge>
                      )}
                    </TD>
                    <TD>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={item.imported || importingId === item._id}
                        onClick={() => void importItem(item)}
                      >
                        {importingId === item._id ? "Importing…" : "Import as draft"}
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={items.totalPages} onPage={setPage} />
          </>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>RSS sources</CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              Add source
            </Button>
          </div>
        </CardHeader>
        {sources.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : sources.error ? (
          <EmptyState title="Could not load sources" description={sources.error} />
        ) : sources.items.length === 0 ? (
          <EmptyState title="No RSS sources" description="Add a feed to start aggregating news." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>URL</TH>
                <TH>Category</TH>
                <TH>Interval</TH>
                <TH>Last fetched</TH>
                <TH>Items</TH>
                <TH>Active</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {sources.items.map((source) => (
                <TR key={source._id}>
                  <TD className="font-medium">{source.name}</TD>
                  <TD className="max-w-xs truncate">{source.url}</TD>
                  <TD>{source.category}</TD>
                  <TD>{source.fetchIntervalMinutes} min</TD>
                  <TD>
                    {source.lastFetchedAt
                      ? new Date(source.lastFetchedAt).toLocaleString()
                      : "Never"}
                  </TD>
                  <TD>{source.lastItemCount}</TD>
                  <TD>
                    {source.active ? (
                      <Badge tone="green">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Paused</Badge>
                    )}
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
                        disabled={fetchingId === source._id}
                        onClick={() => void fetchNow(source)}
                      >
                        Fetch now
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-brand-600 hover:underline"
                        onClick={() => {
                          setEditing(source);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:underline"
                        onClick={() => void deleteSource(source)}
                      >
                        Delete
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit RSS source" : "Add RSS source"}
      >
        <SourceForm
          key={editing?._id ?? "new"}
          initial={editing ?? undefined}
          onDone={() => {
            setDialogOpen(false);
            void sources.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}
