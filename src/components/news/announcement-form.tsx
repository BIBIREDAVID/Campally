"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAnnouncementAction, updateAnnouncementAction, uploadAnnouncementCoverAction } from "@/lib/actions/news";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_LABELS,
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementCategory,
  type AnnouncementPriority,
} from "@/types/domain";
import type { Faculty } from "@/types/domain";

interface Props {
  faculties: Faculty[];
  existing?: Announcement;
}

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnouncementForm({ faculties, existing }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(existing?.cover_image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(existing?.category ?? "student_union");
  const [priority, setPriority] = useState<AnnouncementPriority>(existing?.priority ?? "normal");
  const [audienceType, setAudienceType] = useState<AnnouncementAudience>(existing?.audience_type ?? "everyone");
  const [audienceFacultyId, setAudienceFacultyId] = useState(existing?.audience_faculty_id ?? "");
  const [publishAt, setPublishAt] = useState(toLocalDatetimeInput(existing?.published_at ?? null));
  const [expiresAt, setExpiresAt] = useState(toLocalDatetimeInput(existing?.expires_at ?? null));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadAnnouncementCoverAction(formData);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      setError(result.error);
      return;
    }
    setCoverImageUrl(result.url!);
  }

  async function handleSubmit(e: React.FormEvent, publishNow: boolean) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      title,
      body,
      category,
      priority,
      audienceType,
      audienceFacultyId: audienceType === "faculty" ? audienceFacultyId : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      publishAt: publishNow ? new Date().toISOString() : publishAt ? new Date(publishAt).toISOString() : null,
      coverImageUrl,
    };

    const result = existing
      ? await updateAnnouncementAction(existing.id, input)
      : await createAnnouncementAction(input);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/news");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Cover image (optional)</Label>
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static asset
          <img src={coverImageUrl} alt="" className="h-32 w-full rounded-lg object-cover" />
        )}
        <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
          {uploading ? "Uploading..." : coverImageUrl ? "Replace image" : "Upload a cover image"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select
            items={ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: ANNOUNCEMENT_CATEGORY_LABELS[c] }))}
            value={category}
            onValueChange={(v) => v && setCategory(v as AnnouncementCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANNOUNCEMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {ANNOUNCEMENT_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <Select
            items={[
              { value: "normal", label: "Normal" },
              { value: "urgent", label: "Urgent (pinned on Home)" },
            ]}
            value={priority}
            onValueChange={(v) => v && setPriority(v as AnnouncementPriority)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgent">Urgent (pinned on Home)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Audience</Label>
        <Select
          items={[
            { value: "everyone", label: "Everyone" },
            { value: "faculty", label: "A specific faculty" },
          ]}
          value={audienceType}
          onValueChange={(v) => v && setAudienceType(v as AnnouncementAudience)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="everyone">Everyone</SelectItem>
            <SelectItem value="faculty">A specific faculty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {audienceType === "faculty" && (
        <div className="flex flex-col gap-1.5">
          <Label>Faculty</Label>
          <Select
            items={faculties.map((f) => ({ value: f.id, label: f.name }))}
            value={audienceFacultyId}
            onValueChange={(v) => v && setAudienceFacultyId(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="publishAt">Publish at (leave blank to save as draft)</Label>
          <Input
            id="publishAt"
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiresAt">Expires at (optional)</Label>
          <Input
            id="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting || !title.trim() || !body.trim()}
          onClick={(e) => handleSubmit(e, false)}
        >
          {publishAt ? "Save (scheduled)" : "Save as draft"}
        </Button>
        <Button
          type="button"
          disabled={submitting || !title.trim() || !body.trim() || (audienceType === "faculty" && !audienceFacultyId)}
          onClick={(e) => handleSubmit(e, true)}
        >
          {submitting ? "Publishing..." : "Publish now"}
        </Button>
      </div>
    </form>
  );
}
