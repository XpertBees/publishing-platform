"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { API_URL } from "@/lib/api";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function NewsletterForm({ source = "site" }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, source }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setStatus("done");
    } catch {
      setStatus("error");
      setMessage("Could not subscribe right now. Please try again later.");
    }
  }

  if (status === "done") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
        <MailCheck className="h-5 w-5" aria-hidden /> You&apos;re subscribed. Welcome to The Daily
        Pulse.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          {...register("email")}
          className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {errors.email ? <p className="mt-2 text-xs text-red-600">{errors.email.message}</p> : null}
      {status === "error" ? <p className="mt-2 text-xs text-red-600">{message}</p> : null}
      <p className="mt-2 text-xs text-neutral-500">
        One email a day. No spam — unsubscribe anytime.
      </p>
    </form>
  );
}
