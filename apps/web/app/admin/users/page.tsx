"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ROLES, userCreateSchema, type User, type UserCreateInput } from "@daily-pulse/shared";
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

function UserForm({ initial, onDone }: { initial?: User; onDone: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateInput>({
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      password: "",
      role: initial?.role ?? "author",
    },
  });
  const [error, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (values: UserCreateInput) => {
    setErrorMessage(null);
    try {
      if (initial) {
        // Editing a user updates name/role only; password changes are a
        // separate flow and are not sent from this form.
        const parsed = userCreateSchema
          .omit({ password: true })
          .safeParse({ name: values.name, email: values.email, role: values.role });
        if (!parsed.success) {
          setError("name", { message: parsed.error.issues[0]?.message ?? "Validation failed." });
          return;
        }
        await adminApi.update(`/users/${initial._id}`, { name: values.name, role: values.role });
      } else {
        const parsed = userCreateSchema.safeParse(values);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          if (issue) {
            const field = issue.path[0] as "name" | "email" | "password" | "role";
            setError(field, { message: issue.message });
          }
          return;
        }
        await adminApi.create("/users", parsed.data);
      }
      onDone();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save user.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField label="Name" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>
      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" {...register("email")} disabled={Boolean(initial)} />
      </FormField>
      {initial ? null : (
        <FormField label="Password" hint="Minimum 8 characters." error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </FormField>
      )}
      <FormField label="Role" error={errors.role?.message}>
        <Select {...register("role")}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </FormField>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
        {initial ? "Save changes" : "Create user"}
      </Button>
    </form>
  );
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const list = useAdminList<User>("/users", page);

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Delete user "${user.name}" (${user.email})?`)) return;
    await adminApi.remove(`/users/${user._id}`).catch(() => undefined);
    await list.refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Users & Roles"
        description="Manage admin users and their roles. Only super admins can manage users."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            New user
          </Button>
        }
      />
      <Card>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load users" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState title="No users yet" description="Create your first user." />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((user) => (
                  <TR key={user._id}>
                    <TD className="font-medium">{user.name}</TD>
                    <TD>{user.email}</TD>
                    <TD>{user.role}</TD>
                    <TD>
                      {user.isActive ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="neutral">Inactive</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-600 hover:underline"
                          onClick={() => {
                            setEditing(user);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:underline"
                          onClick={() => void deleteUser(user)}
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
        title={editing ? "Edit user" : "New user"}
      >
        <UserForm
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
