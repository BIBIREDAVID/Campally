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
import { createEventAction, updateEventAction, uploadEventCoverAction } from "@/lib/actions/events";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, type EventCategory, type EventRecord, type Faculty } from "@/types/domain";

interface Props {
  existing?: EventRecord;
  faculties?: Faculty[];
}

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ existing, faculties = [] }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [facultyId, setFacultyId] = useState(existing?.faculty_id ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(existing?.category ?? "social");
  const [startAt, setStartAt] = useState(toLocalDatetimeInput(existing?.start_at ?? null));
  const [endAt, setEndAt] = useState(toLocalDatetimeInput(existing?.end_at ?? null));
  const [location, setLocation] = useState(existing?.location ?? "");
  const [organiser, setOrganiser] = useState(existing?.organiser ?? "");
  const [contactPerson, setContactPerson] = useState(existing?.contact_person ?? "");
  const [capacity, setCapacity] = useState(existing?.capacity?.toString() ?? "");
  const [rsvpEnabled, setRsvpEnabled] = useState(existing?.rsvp_enabled ?? true);
  const [coverImageUrl, setCoverImageUrl] = useState(existing?.cover_image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadEventCoverAction(formData);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      setError(result.error);
      return;
    }
    setCoverImageUrl(result.url!);
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    if (!startAt) {
      setError("Set a start date and time.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const input = {
      title,
      description,
      category,
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : null,
      location,
      organiser,
      contactPerson,
      capacity: capacity ? Number(capacity) : null,
      rsvpEnabled,
      coverImageUrl,
      facultyId: facultyId || null,
    };

    const status = publish ? ("published" as const) : ("draft" as const);
    const result = existing
      ? await updateEventAction(existing.id, input, status)
      : await createEventAction(input, status);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/events");
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Cover image</Label>
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

      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <Select
          items={EVENT_CATEGORIES.map((c) => ({ value: c, label: EVENT_CATEGORY_LABELS[c] }))}
          value={category}
          onValueChange={(v) => v && setCategory(v as EventCategory)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {EVENT_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {faculties.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Faculty (optional)</Label>
          <Select
            items={[{ value: "none", label: "Campus-wide" }, ...faculties.map((f) => ({ value: f.id, label: f.name }))]}
            value={facultyId || "none"}
            onValueChange={(v) => setFacultyId(v === "none" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Campus-wide" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Campus-wide</SelectItem>
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
          <Label htmlFor="startAt">Starts</Label>
          <Input id="startAt" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endAt">Ends (optional)</Label>
          <Input id="endAt" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organiser">Organiser</Label>
          <Input id="organiser" value={organiser} onChange={(e) => setOrganiser(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPerson">Contact person</Label>
          <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="capacity">Capacity (optional)</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={rsvpEnabled}
            onChange={(e) => setRsvpEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Require RSVP
        </label>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting || !title.trim() || !description.trim()}
          onClick={(e) => handleSubmit(e, false)}
        >
          Save as draft
        </Button>
        <Button
          type="button"
          disabled={submitting || !title.trim() || !description.trim()}
          onClick={(e) => handleSubmit(e, true)}
        >
          {submitting ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}
