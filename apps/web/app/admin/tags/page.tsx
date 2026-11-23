"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { slugify, tagSchema, type Tag, type TagInput } from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
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

function TagForm({ initial, onDone }: { initial?: Tag; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TagInput>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: initial?.name ?? "", slug: initial?.slug ?? "" },
  });
  const [error, setError] = useState<string | null>(null);
  const name = watch("name");
  const slug = watch("slug");

  useEffect(() => {
    if (!initial && name && !slug) setValue("slug", slugify(name));
  }, [name, slug, setValue, initial]);

  const onSubmit = async (values: TagInput) => {
    setError(null);
    try {
      if (initial) await adminApi.update(`/tags/${initial._id}`, values);
      else await adminApi.create("/tags", values);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tag.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Name" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>
      <FormField label="Slug" error={errors.slug?.message}>
        <Input {...register("slug")} />
      </FormField>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create tag"}
      </Button>
    </form>
  );
}

export default function TagsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const list = useAdminList<Tag>("/tags", page);

  const deleteTag = async (tag: Tag) => {
    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;
    await adminApi.remove(`/tags/${tag._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Tags"
        description="Free-form labels attached to posts."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New tag
          </Button>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load tags" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No tags yet" description="Create your first tag." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Slug</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((tag) => (
                  <TR key={tag._id}>
                    <TD className="font-medium">{tag.name}</TD>
                    <TD>{tag.slug}</TD>
                    <TD>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-600 hover:underline"
                          onClick={() => {
                            setEditing(tag);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteTag(tag)}
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
        title={editing ? "Edit tag" : "New tag"}
      >
        <TagForm
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
