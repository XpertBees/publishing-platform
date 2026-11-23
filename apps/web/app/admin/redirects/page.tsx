"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirectSchema, type Redirect, type RedirectInput } from "@daily-pulse/shared";
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

function RedirectForm({ initial, onDone }: { initial?: Redirect; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RedirectInput>({
    resolver: zodResolver(redirectSchema),
    defaultValues: {
      from: initial?.from ?? "",
      to: initial?.to ?? "",
      statusCode: initial?.statusCode ?? 301,
      active: initial?.active ?? true,
    },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: RedirectInput) => {
    setError(null);
    try {
      if (initial) await adminApi.update(`/redirects/${initial._id}`, values);
      else await adminApi.create("/redirects", values);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save redirect.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="From path" hint="e.g. /old-article" error={errors.from?.message}>
        <Input {...register("from")} placeholder="/old-path" />
      </FormField>
      <FormField label="To path or URL" error={errors.to?.message}>
        <Input {...register("to")} placeholder="/new-path or https://…" />
      </FormField>
      <FormField label="Status code" error={errors.statusCode?.message}>
        <Select {...register("statusCode", { valueAsNumber: true })}>
          <option value={301}>301 — Permanent</option>
          <option value={302}>302 — Temporary</option>
        </Select>
      </FormField>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" {...register("active")} className="h-4 w-4" />
        Active
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create redirect"}
      </Button>
    </form>
  );
}

export default function RedirectsPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Redirect | null>(null);
  const list = useAdminList<Redirect>("/redirects", page);

  const deleteRedirect = async (redirect: Redirect) => {
    if (!window.confirm(`Delete redirect ${redirect.from}?`)) return;
    await adminApi.remove(`/redirects/${redirect._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Redirects"
        description="URL redirects with hit counts."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New redirect
          </Button>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load redirects" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No redirects yet" description="Create your first redirect." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>From</TH>
                  <TH>To</TH>
                  <TH>Code</TH>
                  <TH>Hits</TH>
                  <TH>Active</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((redirect) => (
                  <TR key={redirect._id}>
                    <TD className="font-mono text-xs">{redirect.from}</TD>
                    <TD className="font-mono text-xs">{redirect.to}</TD>
                    <TD>{redirect.statusCode}</TD>
                    <TD>{redirect.hits.toLocaleString()}</TD>
                    <TD>
                      {redirect.active ? (
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
                            setEditing(redirect);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteRedirect(redirect)}
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
        title={editing ? "Edit redirect" : "New redirect"}
      >
        <RedirectForm
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
