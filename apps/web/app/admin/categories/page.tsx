"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, slugify, type Category, type CategoryInput } from "@daily-pulse/shared";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

function CategoryForm({ initial, onDone }: { initial?: Category; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      parent: initial?.parent ?? null,
      order: initial?.order ?? 0,
      isVertical: initial?.isVertical ?? false,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [parents, setParents] = useState<Category[]>([]);
  const name = watch("name");
  const slug = watch("slug");

  useEffect(() => {
    adminApi
      .list<Category>("/categories?pageSize=100")
      .then((r) => setParents(r.items.filter((c) => c._id !== initial?._id)))
      .catch(() => undefined);
  }, [initial?._id]);

  useEffect(() => {
    if (!initial && name && !slug) setValue("slug", slugify(name));
  }, [name, slug, setValue, initial]);

  const onSubmit = async (values: CategoryInput) => {
    setError(null);
    const payload = { ...values, parent: values.parent || null };
    try {
      if (initial) await adminApi.update(`/categories/${initial._id}`, payload);
      else await adminApi.create("/categories", payload);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
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
      <FormField label="Description" error={errors.description?.message}>
        <Textarea rows={2} {...register("description")} />
      </FormField>
      <FormField label="Parent category">
        <Select {...register("parent")}>
          <option value="">None (top level)</option>
          {parents.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Order" error={errors.order?.message}>
        <Input type="number" {...register("order", { valueAsNumber: true })} />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register("isVertical")} className="h-4 w-4" />
        Vertical (top-level section, e.g. Lifestyle)
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create category"}
      </Button>
    </form>
  );
}

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const list = useAdminList<Category>("/categories", page);

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    await adminApi.remove(`/categories/${category._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Categories & Tags"
        description="Organise posts into categories and verticals."
        action={
          <div className="flex gap-2">
            <Link href="/admin/tags">
              <Button variant="outline">Manage tags</Button>
            </Link>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              New category
            </Button>
          </div>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load categories" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No categories yet" description="Create your first category." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Slug</TH>
                  <TH>Order</TH>
                  <TH>Vertical</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((category) => (
                  <TR key={category._id}>
                    <TD className="font-medium">{category.name}</TD>
                    <TD>{category.slug}</TD>
                    <TD>{category.order}</TD>
                    <TD>{category.isVertical ? <Badge tone="blue">Vertical</Badge> : "—"}</TD>
                    <TD>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-600 hover:underline"
                          onClick={() => {
                            setEditing(category);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteCategory(category)}
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
        title={editing ? "Edit category" : "New category"}
      >
        <CategoryForm
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
