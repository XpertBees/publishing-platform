"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { SeoSettings } from "@daily-pulse/shared";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

interface SeoFormValues {
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  twitterHandle: string;
  googleNewsEnabled: boolean;
  robotsTxt: string;
}

export default function SeoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<SeoFormValues>({
    defaultValues: {
      defaultTitle: "",
      defaultDescription: "",
      defaultOgImage: "",
      twitterHandle: "",
      googleNewsEnabled: false,
      robotsTxt: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<SeoSettings>("/seo-settings")
      .then((data) => {
        if (cancelled) return;
        reset({
          defaultTitle: data.defaultTitle ?? "",
          defaultDescription: data.defaultDescription ?? "",
          defaultOgImage: data.defaultOgImage ?? "",
          twitterHandle: data.twitterHandle ?? "",
          googleNewsEnabled: data.googleNewsEnabled ?? false,
          robotsTxt: data.robotsTxt ?? "",
        });
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (values: SeoFormValues) => {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await adminApi.update("/seo-settings", values);
      setNotice("SEO settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SEO settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="SEO" description="Default metadata and robots.txt for the site." />
      {error ? (
        <Card className="mb-4">
          <EmptyState title="Could not load SEO settings" description={error} />
        </Card>
      ) : null}
      {notice ? (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Default metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Default title">
              <Input {...register("defaultTitle")} />
            </FormField>
            <FormField label="Default description">
              <Textarea rows={3} {...register("defaultDescription")} />
            </FormField>
            <FormField label="Default OG image URL">
              <Input {...register("defaultOgImage")} placeholder="https://…" />
            </FormField>
            <FormField label="Twitter handle">
              <Input {...register("twitterHandle")} placeholder="@thedailypulse" />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" {...register("googleNewsEnabled")} className="h-4 w-4" />
              Google News enabled
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>robots.txt</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField label="robots.txt content" hint="Served as the site robots.txt.">
              <Textarea
                rows={10}
                {...register("robotsTxt")}
                className="font-mono text-xs"
                placeholder={"User-agent: *\nAllow: /"}
              />
            </FormField>
          </CardContent>
        </Card>
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : null}
          Save SEO settings
        </Button>
      </form>
    </div>
  );
}
