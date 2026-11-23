"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authorSchema, slugify, type Author, type AuthorInput } from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

function AuthorForm({ initial, onDone }: { initial?: Author; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AuthorInput>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      bio: initial?.bio ?? "",
      avatar: initial?.avatar ?? "",
      role: initial?.role ?? "",
      socials: initial?.socials ?? {},
      userId: initial?.userId ?? "",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const name = watch("name");
  const slug = watch("slug");

  useEffect(() => {
    if (!initial && name && !slug) setValue("slug", slugify(name));
  }, [name, slug, setValue, initial]);

  const onSubmit = async (values: AuthorInput) => {
    setError(null);
    const payload: AuthorInput = {
      ...values,
      socials:
        values.socials && Object.keys(values.socials).length > 0 ? values.socials : undefined,
    };
    try {
      if (initial) await adminApi.update(`/authors/${initial._id}`, payload);
      else await adminApi.create("/authors", payload);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save author.");
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
      <FormField label="Role" error={errors.role?.message}>
        <Input {...register("role")} placeholder="e.g. Staff Writer" />
      </FormField>
      <FormField label="Bio" error={errors.bio?.message}>
        <Textarea rows={3} {...register("bio")} />
      </FormField>
      <FormField label="Avatar URL" error={errors.avatar?.message}>
        <Input {...register("avatar")} placeholder="https://…" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="X / Twitter URL">
          <Input {...register("socials.twitter")} placeholder="https://x.com/…" />
        </FormField>
        <FormField label="LinkedIn URL">
          <Input {...register("socials.linkedin")} placeholder="https://linkedin.com/in/…" />
        </FormField>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create author"}
      </Button>
    </form>
  );
}

export default function AuthorsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const list = useAdminList<Author>("/authors", page);

  const deleteAuthor = async (author: Author) => {
    if (!window.confirm(`Delete author "${author.name}"?`)) return;
    await adminApi.remove(`/authors/${author._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Authors"
        description="Writer profiles shown on posts."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New author
          </Button>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load authors" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No authors yet" description="Create your first author profile." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Slug</TH>
                  <TH>Role</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((author) => (
                  <TR key={author._id}>
                    <TD className="font-medium">{author.name}</TD>
                    <TD>{author.slug}</TD>
                    <TD>{author.role ?? "—"}</TD>
                    <TD>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-600 hover:underline"
                          onClick={() => {
                            setEditing(author);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteAuthor(author)}
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
        title={editing ? "Edit author" : "New author"}
      >
        <AuthorForm
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
