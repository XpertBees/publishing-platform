"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_URL } from "@/lib/api";

const schema = z.object({ buyerEmail: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function BuyProductForm({
  productId,
  productName,
  price,
  currency,
}: {
  productId: string;
  productName: string;
  price: number;
  currency: string;
}) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: productId, buyerEmail: values.buyerEmail }),
      });
      if (!res.ok) throw new Error("Order failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
        Order placed for {productName}. Check your inbox for download and payment details.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <p className="text-2xl font-bold text-neutral-900">
        {(price / 100).toFixed(2)} {currency}
      </p>
      <div>
        <label htmlFor="buyer-email" className="mb-1 block text-sm font-medium text-neutral-700">
          Email for delivery
        </label>
        <input
          id="buyer-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("buyerEmail")}
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
        {errors.buyerEmail ? (
          <p className="mt-1 text-xs text-red-600">{errors.buyerEmail.message}</p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isSubmitting ? "Placing order…" : "Buy now"}
      </button>
      {status === "error" ? (
        <p className="text-sm text-red-600">Could not place the order. Please try again later.</p>
      ) : null}
      <p className="text-xs text-neutral-500">
        Secure checkout. Your download link is emailed after payment.
      </p>
    </form>
  );
}
