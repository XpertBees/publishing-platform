"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  affiliateLinkSchema,
  type AffiliateLink,
  type AffiliateLinkInput,
} from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

function AffiliateForm({ initial, onDone }: { initial?: AffiliateLink; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AffiliateLinkInput>({
    resolver: zodResolver(affiliateLinkSchema),
    defaultValues: {
      title: initial?.title ?? "",
      targetUrl: initial?.targetUrl ?? "",
      slug: initial?.slug ?? "",
      category: initial?.category ?? "",
      active: initial?.active ?? true,
    },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: AffiliateLinkInput) => {
    setError(null);
    try {
      if (initial) await adminApi.update(`/affiliates/${initial._id}`, values);
      else await adminApi.create("/affiliates", values);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save affiliate link.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Title" error={errors.title?.message}>
        <Input {...register("title")} />
      </FormField>
      <FormField label="Target URL" error={errors.targetUrl?.message}>
        <Input {...register("targetUrl")} placeholder="https://…" />
      </FormField>
      <FormField label="Slug" hint="Public link will be /go/<slug>." error={errors.slug?.message}>
        <Input {...register("slug")} />
      </FormField>
      <FormField label="Category" error={errors.category?.message}>
        <Input {...register("category")} />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4" />
        Active
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create link"}
      </Button>
    </form>
  );
}

export default function AffiliatesPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AffiliateLink | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const list = useAdminList<AffiliateLink>("/affiliates", page);

  const copyLink = async (link: AffiliateLink) => {
    const url = `${window.location.origin}/go/${link.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(link._id);
      window.setTimeout(() => setCopied((c) => (c === link._id ? null : c)), 2000);
    } catch {
      window.prompt("Copy the link:", url);
    }
  };

  const deleteLink = async (link: AffiliateLink) => {
    if (!window.confirm(`Delete affiliate link "${link.title}"?`)) return;
    await adminApi.remove(`/affiliates/${link._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Affiliates"
        description="Tracked outbound links served from /go/<slug>."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New link
          </Button>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load affiliate links" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="No affiliate links yet"
            description="Create your first tracked link."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Short link</TH>
                  <TH>Clicks</TH>
                  <TH>Active</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((link) => (
                  <TR key={link._id}>
                    <TD className="font-medium">{link.title}</TD>
                    <TD className="font-mono text-xs">/go/{link.slug}</TD>
                    <TD>{link.clicks.toLocaleString()}</TD>
                    <TD>
                      {link.active ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="neutral">Off</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-600 hover:underline"
                          onClick={() => void copyLink(link)}
                        >
                          {copied === link._id ? "Copied!" : "Copy link"}
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-600 hover:underline"
                          onClick={() => {
                            setEditing(link);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteLink(link)}
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
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit affiliate link" : "New affiliate link"}
      >
        <AffiliateForm
          key={editing?._id ?? "new"}
          initial={editing ?? undefined}
          onDone={() => {
            setDialogOpen(false);
            void list.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}
