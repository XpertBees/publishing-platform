"use client";

import { useState } from "react";
import type { Order } from "@daily-pulse/shared";
import { adminApi, useAdminList } from "@/lib/admin-api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

const ORDER_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const list = useAdminList<Order>(
    statusFilter ? `/orders?status=${statusFilter}` : "/orders",
    page,
  );

  const updateStatus = async (order: Order, status: string) => {
    setUpdatingId(order._id);
    setNotice(null);
    try {
      await adminApi.update(`/orders/${order._id}`, { status });
      await list.refresh();
      setNotice(`Order ${order._id.slice(0, 8)} updated to ${status}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Digital product orders and their payment status."
      />
      {notice ? (
        <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">{notice}</p>
      ) : null}
      <Card>
        <div className="border-b border-neutral-200 px-4 py-3">
          <Select
            className="w-48"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        {list.loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : list.error ? (
          <EmptyState title="Could not load orders" description={list.error} />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Orders will appear here once products sell."
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Product</TH>
                  <TH>Buyer</TH>
                  <TH>Amount</TH>
                  <TH>Status</TH>
                  <TH>Created</TH>
                  <TH>Update status</TH>
                </TR>
              </THead>
              <TBody>
                {list.items.map((order) => (
                  <TR key={order._id}>
                    <TD className="font-mono text-xs">{order._id.slice(0, 8)}</TD>
                    <TD>{order.productName}</TD>
                    <TD>{order.buyerEmail}</TD>
                    <TD>
                      {(order.amount / 100).toFixed(2)} {order.currency}
                    </TD>
                    <TD>
                      <StatusBadge status={order.status} />
                    </TD>
                    <TD>{new Date(order.createdAt).toLocaleDateString()}</TD>
                    <TD>
                      <Select
                        className="w-32"
                        value={order.status}
                        disabled={updatingId === order._id}
                        onChange={(e) => void updateStatus(order, e.target.value)}
                        aria-label={`Update status for order ${order._id.slice(0, 8)}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={list.totalPages} onPage={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
