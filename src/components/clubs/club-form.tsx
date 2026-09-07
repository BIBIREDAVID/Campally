"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, Plus, X } from "lucide-react";
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
import { createClubAction, updateClubAction, uploadClubImageAction } from "@/lib/actions/clubs";
import {
  CLUB_CATEGORIES,
  CLUB_CATEGORY_LABELS,
  type ClubCategory,
  type ClubExecutive,
  type ClubMembershipMode,
  type ClubRecord,
} from "@/types/domain";

interface Props {
  existing?: ClubRecord;
}

export function ClubForm({ existing }: Props) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<ClubCategory>(existing?.category ?? "academic");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [contactEmail, setContactEmail] = useState(existing?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(existing?.contact_phone ?? "");
  const [instagram, setInstagram] = useState(existing?.social_links?.instagram ?? "");
  const [whatsapp, setWhatsapp] = useState(existing?.social_links?.whatsapp ?? "");
  const [website, setWebsite] = useState(existing?.social_links?.website ?? "");
  const [membershipMode, setMembershipMode] = useState<ClubMembershipMode>(existing?.membership_mode ?? "request");
  const [executives, setExecutives] = useState<ClubExecutive[]>(existing?.executives ?? []);
  const [logoUrl, setLogoUrl] = useState(existing?.logo_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(existing?.cover_image_url ?? "");
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "cover") {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(target);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadClubImageAction(formData);

    setUploading(null);
    const ref = target === "logo" ? logoInputRef : coverInputRef;
    if (ref.current) ref.current.value = "";

    if (result.error) {
      setError(result.error);
      return;
    }
    if (target === "logo") setLogoUrl(result.url!);
    else setCoverImageUrl(result.url!);
  }

  function addExecutive() {
    setExecutives((prev) => [...prev, { name: "", title: "" }]);
  }

  function updateExecutive(index: number, field: "name" | "title", value: string) {
    setExecutives((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  }

  function removeExecutive(index: number) {
    setExecutives((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      name,
      category,
      description,
      contactEmail,
      contactPhone,
      socialLinks: { instagram, whatsapp, website },
      executives: executives.filter((ex) => ex.name.trim()),
      membershipMode,
      logoUrl,
      coverImageUrl,
    };

    const status = publish ? ("published" as const) : ("draft" as const);
    const result = existing ? await updateClubAction(existing.id, input, status) : await createClubAction(input, status);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/clubs");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Club name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Logo</Label>
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
            <img src={logoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            {uploading === "logo" ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
            {uploading === "logo" ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
            <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e, "logo")} disabled={!!uploading} />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Cover image</Label>
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
            <img src={coverImageUrl} alt="" className="h-16 w-full rounded-lg object-cover" />
          )}
          <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            {uploading === "cover" ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
            {uploading === "cover" ? "Uploading..." : coverImageUrl ? "Replace cover" : "Upload cover"}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleUpload(e, "cover")} disabled={!!uploading} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select
            items={CLUB_CATEGORIES.map((c) => ({ value: c, label: CLUB_CATEGORY_LABELS[c] }))}
            value={category}
            onValueChange={(v) => v && setCategory(v as ClubCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLUB_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CLUB_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Membership</Label>
          <Select
            items={[
              { value: "open", label: "Open — anyone can join" },
              { value: "request", label: "Request — admin approves" },
            ]}
            value={membershipMode}
            onValueChange={(v) => v && setMembershipMode(v as ClubMembershipMode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open — anyone can join</SelectItem>
              <SelectItem value="request">Request — admin approves</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+234..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Executives / committee</Label>
          <Button type="button" variant="outline" size="sm" onClick={addExecutive} className="gap-1">
            <Plus size={13} /> Add
          </Button>
        </div>
        {executives.length === 0 && <p className="text-xs text-muted-foreground">No executives added yet.</p>}
        {executives.map((ex, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Name" value={ex.name} onChange={(e) => updateExecutive(i, "name", e.target.value)} />
            <Input placeholder="Title" value={ex.title} onChange={(e) => updateExecutive(i, "title", e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeExecutive(i)}>
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={submitting || !name.trim() || !description.trim()} onClick={(e) => handleSubmit(e, false)}>
          Save as draft
        </Button>
        <Button type="button" disabled={submitting || !name.trim() || !description.trim()} onClick={(e) => handleSubmit(e, true)}>
          {submitting ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}
