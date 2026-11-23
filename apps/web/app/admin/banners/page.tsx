"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bannerSchema, type Banner, type BannerInput } from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

const PLACEMENTS = ["home_hero", "sidebar", "in_article", "footer", "category_top"];

function toDatetimeLocal(iso?: string): string {
  return iso ? iso.slice(0, 16) : "";
}

function BannerForm({ initial, onDone }: { initial?: Banner; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BannerInput>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: initial?.title ?? "",
      imageUrl: initial?.imageUrl ?? "",
      linkUrl: initial?.linkUrl ?? "",
      placement: initial?.placement ?? "sidebar",
      active: initial?.active ?? true,
      startsAt: initial?.startsAt,
      endsAt: initial?.endsAt,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initial?.endsAt));

  const onSubmit = async (values: BannerInput) => {
    setError(null);
    const payload = {
      ...values,
      startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
    };
    try {
      if (initial) await adminApi.update(`/banners/${initial._id}`, payload);
      else await adminApi.create("/banners", payload);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save banner.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Title" error={errors.title?.message}>
        <Input {...register("title")} />
      </FormField>
      <FormField label="Image URL" error={errors.imageUrl?.message}>
        <Input {...register("imageUrl")} placeholder="https://…" />
      </FormField>
      <FormField label="Link URL" error={errors.linkUrl?.message}>
        <Input
          {...register("linkUrl", { setValueAs: (v: string) => v || undefined })}
          placeholder="https://…"
        />
      </FormField>
      <FormField label="Placement" error={errors.placement?.message}>
        <Select {...register("placement")}>
          {PLACEMENTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Starts at">
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </FormField>
        <FormField label="Ends at">
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4" />
        Active
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create banner"}
      </Button>
    </form>
  );
}

export default function BannersPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const list = useAdminList<Banner>("/banners", page);

  const deleteBanner = async (banner: Banner) => {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;
    await adminApi.remove(`/banners/${banner._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Banners"
        description="House ads and promotional banners by placement."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New banner
          </Button>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load banners" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No banners yet" description="Create your first banner." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Placement</TH>
                  <TH>Clicks</TH>
                  <TH>Impressions</TH>
                  <TH>Active</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((banner) => (
                  <TR key={banner._id}>
                    <TD className="font-medium">{banner.title}</TD>
                    <TD>{banner.placement}</TD>
                    <TD>{banner.clicks.toLocaleString()}</TD>
                    <TD>{banner.impressions.toLocaleString()}</TD>
                    <TD>
                      {banner.active ? (
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
                          onClick={() => {
                            setEditing(banner);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteBanner(banner)}
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
        title={editing ? "Edit banner" : "New banner"}
      >
        <BannerForm
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
