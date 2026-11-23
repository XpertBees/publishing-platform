"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  POST_STATUSES,
  POST_TYPES,
  postCreateSchema,
  type Author,
  type Category,
  type Post,
  type PostCreateInput,
} from "@daily-pulse/shared";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./form-field";

function toList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toDatetimeLocal(iso?: string): string {
  return iso ? iso.slice(0, 16) : "";
}

export function PostForm({ initial }: { initial?: Post }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [galleryText, setGalleryText] = useState((initial?.gallery ?? []).join(", "));
  const [bodyText, setBodyText] = useState(
    initial?.body ? JSON.stringify(initial.body, null, 2) : "",
  );
  const [publishedAtLocal, setPublishedAtLocal] = useState(toDatetimeLocal(initial?.publishedAt));
  const [seoTitle, setSeoTitle] = useState(initial?.seo?.title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo?.description ?? "");
  const [seoKeywords, setSeoKeywords] = useState((initial?.seo?.keywords ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostCreateInput>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: {
      title: initial?.title ?? "",
      headline: initial?.headline ?? "",
      summary: initial?.summary ?? "",
      featuredImage: initial?.featuredImage ?? "",
      gallery: initial?.gallery ?? [],
      externalUrl: initial?.externalUrl ?? "",
      ctaLabel: initial?.ctaLabel ?? "Read More",
      category: initial?.category ?? "",
      tags: initial?.tags ?? [],
      author: initial?.author ?? "",
      postType: initial?.postType ?? "editorial",
      language: initial?.language ?? "en",
      status: initial?.status ?? "draft",
      seo: initial?.seo ?? { keywords: [], noIndex: false },
      sponsored: initial?.sponsored ?? false,
      affiliateDisclosure: initial?.affiliateDisclosure ?? false,
      canonicalUrl: initial?.canonicalUrl ?? "",
      sourceName: initial?.sourceName ?? "",
      sourceUrl: initial?.sourceUrl ?? "",
    },
  });

  useEffect(() => {
    adminApi
      .list<Category>("/categories?pageSize=100")
      .then((r) => setCategories(r.items))
      .catch(() => undefined);
    adminApi
      .list<Author>("/authors?pageSize=100")
      .then((r) => setAuthors(r.items))
      .catch(() => undefined);
  }, []);

  const onSubmit = async (values: PostCreateInput) => {
    setFormError(null);
    let body: unknown;
    if (bodyText.trim()) {
      try {
        body = JSON.parse(bodyText) as unknown;
      } catch {
        setFormError("Body must be valid JSON.");
        return;
      }
    }
    const payload = {
      ...values,
      tags: toList(tagsText),
      gallery: toList(galleryText),
      body,
      publishedAt: publishedAtLocal ? new Date(publishedAtLocal).toISOString() : undefined,
      seo: {
        title: seoTitle || undefined,
        description: seoDescription || undefined,
        keywords: toList(seoKeywords),
        noIndex: values.seo?.noIndex ?? false,
      },
    };
    const parsed = postCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Validation failed.");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && initial) {
        await adminApi.update(`/posts/${initial._id}`, parsed.data);
      } else {
        await adminApi.create("/posts", parsed.data);
      }
      router.push("/admin/posts");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card>
        <CardContent className="space-y-4 pt-5">
          <FormField label="Title" error={errors.title?.message}>
            <Input {...register("title")} placeholder="Post title" />
          </FormField>
          <FormField label="Headline" error={errors.headline?.message}>
            <Input {...register("headline")} placeholder="Optional display headline" />
          </FormField>
          <FormField label="Summary" error={errors.summary?.message}>
            <Textarea
              rows={3}
              {...register("summary")}
              placeholder="Short summary (max 500 characters)"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category" error={errors.category?.message}>
              <Select {...register("category")}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Author" error={errors.author?.message}>
              <Select {...register("author")}>
                <option value="">Select an author</option>
                {authors.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Post type" error={errors.postType?.message}>
              <Select {...register("postType")}>
                {POST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status" error={errors.status?.message}>
              <Select {...register("status")}>
                {POST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Language" error={errors.language?.message}>
              <Input {...register("language")} placeholder="en" />
            </FormField>
            <FormField label="Publish at" hint="Only used when status is scheduled.">
              <Input
                type="datetime-local"
                value={publishedAtLocal}
                onChange={(e) => setPublishedAtLocal(e.target.value)}
              />
            </FormField>
            <FormField label="CTA label" error={errors.ctaLabel?.message}>
              <Input {...register("ctaLabel")} />
            </FormField>
            <FormField label="Featured image URL" error={errors.featuredImage?.message}>
              <Input {...register("featuredImage")} placeholder="https://…" />
            </FormField>
          </div>
          <FormField label="Tags" hint="Comma-separated.">
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="news, finance"
            />
          </FormField>
          <FormField label="Gallery image URLs" hint="Comma-separated.">
            <Input
              value={galleryText}
              onChange={(e) => setGalleryText(e.target.value)}
              placeholder="https://…"
            />
          </FormField>
          <FormField label="Body (JSON blocks)" hint="Structured rich-text blocks as JSON.">
            <Textarea
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder='[{"type":"paragraph","text":"…"}]'
              className="font-mono text-xs"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="External URL" error={errors.externalUrl?.message}>
              <Input
                {...register("externalUrl", { setValueAs: (v: string) => v || undefined })}
                placeholder="https://…"
              />
            </FormField>
            <FormField label="Canonical URL" error={errors.canonicalUrl?.message}>
              <Input
                {...register("canonicalUrl", { setValueAs: (v: string) => v || undefined })}
                placeholder="https://…"
              />
            </FormField>
            <FormField label="Source name" error={errors.sourceName?.message}>
              <Input {...register("sourceName")} placeholder="For aggregated news" />
            </FormField>
            <FormField label="Source URL" error={errors.sourceUrl?.message}>
              <Input
                {...register("sourceUrl", { setValueAs: (v: string) => v || undefined })}
                placeholder="https://…"
              />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" {...register("sponsored")} className="h-4 w-4" />
              Sponsored post
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" {...register("affiliateDisclosure")} className="h-4 w-4" />
              Affiliate disclosure
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <h2 className="text-sm font-semibold text-neutral-900">SEO</h2>
          <FormField label="SEO title">
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={120} />
          </FormField>
          <FormField label="SEO description">
            <Textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={200}
            />
          </FormField>
          <FormField label="SEO keywords" hint="Comma-separated.">
            <Input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} />
          </FormField>
        </CardContent>
      </Card>

      {formError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : null}
          {isEdit ? "Save changes" : "Create post"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/posts")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
