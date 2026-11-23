"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { SiteSettings } from "@daily-pulse/shared";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormField } from "@/components/admin/form-field";

interface SettingsFormValues {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  adsenseClientId: string;
  gaMeasurementId: string;
  socialTwitter: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  socialLinkedin: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<SettingsFormValues>({
    defaultValues: {
      siteName: "",
      tagline: "",
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "#1d4ed8",
      adsenseClientId: "",
      gaMeasurementId: "",
      socialTwitter: "",
      socialFacebook: "",
      socialInstagram: "",
      socialYoutube: "",
      socialLinkedin: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<SiteSettings>("/site-settings")
      .then((data) => {
        if (cancelled) return;
        const socials = data.socialLinks ?? {};
        reset({
          siteName: data.siteName ?? "",
          tagline: data.tagline ?? "",
          logoUrl: data.logoUrl ?? "",
          faviconUrl: data.faviconUrl ?? "",
          primaryColor: data.primaryColor ?? "#1d4ed8",
          adsenseClientId: data.adsenseClientId ?? "",
          gaMeasurementId: data.gaMeasurementId ?? "",
          socialTwitter: socials.twitter ?? "",
          socialFacebook: socials.facebook ?? "",
          socialInstagram: socials.instagram ?? "",
          socialYoutube: socials.youtube ?? "",
          socialLinkedin: socials.linkedin ?? "",
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

  const onSubmit = async (values: SettingsFormValues) => {
    setSaving(true);
    setNotice(null);
    setError(null);
    const socialLinks: Record<string, string> = {};
    if (values.socialTwitter) socialLinks.twitter = values.socialTwitter;
    if (values.socialFacebook) socialLinks.facebook = values.socialFacebook;
    if (values.socialInstagram) socialLinks.instagram = values.socialInstagram;
    if (values.socialYoutube) socialLinks.youtube = values.socialYoutube;
    if (values.socialLinkedin) socialLinks.linkedin = values.socialLinkedin;
    try {
      await adminApi.update("/site-settings", {
        siteName: values.siteName,
        tagline: values.tagline || undefined,
        logoUrl: values.logoUrl || undefined,
        faviconUrl: values.faviconUrl || undefined,
        primaryColor: values.primaryColor,
        adsenseClientId: values.adsenseClientId || undefined,
        gaMeasurementId: values.gaMeasurementId || undefined,
        socialLinks,
      });
      setNotice("Site settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save site settings.");
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
      <AdminPageHeader
        title="Settings"
        description="Site identity, branding and monetisation IDs."
      />
      {error ? (
        <Card className="mb-4">
          <EmptyState title="Could not load site settings" description={error} />
        </Card>
      ) : null}
      {notice ? (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Site identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Site name">
              <Input {...register("siteName")} />
            </FormField>
            <FormField label="Tagline">
              <Input {...register("tagline")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Logo URL">
                <Input {...register("logoUrl")} placeholder="https://…" />
              </FormField>
              <FormField label="Favicon URL">
                <Input {...register("faviconUrl")} placeholder="https://…" />
              </FormField>
            </div>
            <FormField label="Primary colour">
              <Input type="color" {...register("primaryColor")} className="h-10 w-20 p-1" />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monetisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="AdSense client ID" hint="e.g. ca-pub-XXXXXXXXXXXXXXXX">
              <Input {...register("adsenseClientId")} placeholder="ca-pub-" />
            </FormField>
            <FormField label="Google Analytics measurement ID" hint="e.g. G-XXXXXXXXXX">
              <Input {...register("gaMeasurementId")} placeholder="G-" />
            </FormField>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Social links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="X / Twitter URL">
              <Input {...register("socialTwitter")} placeholder="https://x.com/…" />
            </FormField>
            <FormField label="Facebook URL">
              <Input {...register("socialFacebook")} placeholder="https://facebook.com/…" />
            </FormField>
            <FormField label="Instagram URL">
              <Input {...register("socialInstagram")} placeholder="https://instagram.com/…" />
            </FormField>
            <FormField label="YouTube URL">
              <Input {...register("socialYoutube")} placeholder="https://youtube.com/…" />
            </FormField>
            <FormField label="LinkedIn URL">
              <Input {...register("socialLinkedin")} placeholder="https://linkedin.com/…" />
            </FormField>
          </CardContent>
        </Card>
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : null}
          Save settings
        </Button>
      </form>
    </div>
  );
}
