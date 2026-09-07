"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenantBrandingAction, uploadTenantLogoAction } from "@/lib/actions/tenant";
import type { Tenant } from "@/types/domain";

export function TenantBrandingForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(tenant.name);
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color ?? "#3b6ef6");
  const [studentEmailDomain, setStudentEmailDomain] = useState(tenant.student_email_domain);
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadTenantLogoAction(formData);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      setError(result.error);
      return;
    }
    setLogoUrl(result.url!);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await updateTenantBrandingAction(tenant.id, {
      name,
      primaryColor,
      studentEmailDomain,
      logoUrl,
    });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-[var(--status-open)]">Settings saved.</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Union / institution name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="studentEmailDomain">Student email domain</Label>
        <Input
          id="studentEmailDomain"
          value={studentEmailDomain}
          onChange={(e) => setStudentEmailDomain(e.target.value)}
          placeholder="lasu.edu.ng"
          required
        />
        <p className="text-xs text-muted-foreground">Used to validate signups — students must use this domain.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="primaryColor">Primary color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
            aria-label="Primary color"
          />
          <Input
            id="primaryColor"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#3b6ef6"
            className="font-mono"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Crest / logo</Label>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static asset
          <img src={logoUrl} alt="" className="h-16 w-16 rounded-full border border-border bg-white object-contain p-1" />
        )}
        <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
          {uploading ? "Uploading..." : logoUrl ? "Replace logo" : "Upload a logo"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoUpload}
            disabled={uploading}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Stored, but the site header currently always shows the LASU Students&apos; Union crest —
          this field is ready for when Union manages more than one institution.
        </p>
      </div>

      <Button type="submit" disabled={submitting || uploading} className="mt-1 w-fit">
        {submitting ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
