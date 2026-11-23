"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type Product, type ProductInput } from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
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

function ProductForm({ initial, onDone }: { initial?: Product; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? 0,
      currency: initial?.currency ?? "INR",
      fileUrl: initial?.fileUrl ?? "",
      coverImage: initial?.coverImage ?? "",
      active: initial?.active ?? true,
    },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: ProductInput) => {
    setError(null);
    try {
      if (initial) await adminApi.update(`/products/${initial._id}`, values);
      else await adminApi.create("/products", values);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
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
        <Textarea rows={3} {...register("description")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Price (minor units, e.g. paise)" error={errors.price?.message}>
          <Input type="number" min={0} {...register("price", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Currency" error={errors.currency?.message}>
          <Input {...register("currency")} />
        </FormField>
      </div>
      <FormField label="File URL" error={errors.fileUrl?.message}>
        <Input {...register("fileUrl")} placeholder="https://…" />
      </FormField>
      <FormField label="Cover image URL" error={errors.coverImage?.message}>
        <Input {...register("coverImage")} placeholder="https://…" />
      </FormField>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4" />
        Active
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const list = useAdminList<Product>("/products", page);

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    await adminApi.remove(`/products/${product._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Digital products sold from the site."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New product
          </Button>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load products" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No products yet" description="Create your first digital product." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Price</TH>
                  <TH>Sales</TH>
                  <TH>Active</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((product) => (
                  <TR key={product._id}>
                    <TD className="font-medium">{product.name}</TD>
                    <TD>
                      {(product.price / 100).toFixed(2)} {product.currency}
                    </TD>
                    <TD>{product.sales}</TD>
                    <TD>
                      {product.active ? (
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
                            setEditing(product);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteProduct(product)}
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
        title={editing ? "Edit product" : "New product"}
      >
        <ProductForm
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
