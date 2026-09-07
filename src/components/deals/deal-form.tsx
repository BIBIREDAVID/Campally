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
import { createDealAction, updateDealAction, uploadDealLogoAction } from "@/lib/actions/deals";
import { DEAL_CATEGORIES, DEAL_CATEGORY_LABELS, type DealCategory, type DealRecord } from "@/types/domain";

interface Props {
  existing?: DealRecord;
}

export function DealForm({ existing }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [merchantName, setMerchantName] = useState(existing?.merchant_name ?? "");
  const [category, setCategory] = useState<DealCategory>(existing?.category ?? "restaurants");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [discountSummary, setDiscountSummary] = useState(existing?.discount_summary ?? "");
  const [eligibility, setEligibility] = useState(existing?.eligibility ?? "");
  const [promoCode, setPromoCode] = useState(existing?.promo_code ?? "");
  const [redemptionInstructions, setRedemptionInstructions] = useState(existing?.redemption_instructions ?? "");
  const [locations, setLocations] = useState(existing?.locations ?? "");
  const [expiresAt, setExpiresAt] = useState(existing?.expires_at ?? "");
  const [terms, setTerms] = useState(existing?.terms ?? "");
  const [contactInfo, setContactInfo] = useState(existing?.contact_info ?? "");
  const [externalUrl, setExternalUrl] = useState(existing?.external_url ?? "");
  const [logoUrl, setLogoUrl] = useState(existing?.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadDealLogoAction(formData);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      setError(result.error);
      return;
    }
    setLogoUrl(result.url!);
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      merchantName,
      category,
      description,
      discountSummary,
      eligibility,
      promoCode,
      redemptionInstructions,
      locations,
      expiresAt: expiresAt || null,
      terms,
      contactInfo,
      externalUrl,
      logoUrl,
    };

    const status = publish ? ("published" as const) : ("draft" as const);
    const result = existing ? await updateDealAction(existing.id, input, status) : await createDealAction(input, status);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/deals");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="merchantName">Merchant / business name</Label>
        <Input id="merchantName" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Logo</Label>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img src={logoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
        )}
        <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
          {uploading ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select
            items={DEAL_CATEGORIES.map((c) => ({ value: c, label: DEAL_CATEGORY_LABELS[c] }))}
            value={category}
            onValueChange={(v) => v && setCategory(v as DealCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {DEAL_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discountSummary">Discount</Label>
          <Input id="discountSummary" value={discountSummary} onChange={(e) => setDiscountSummary(e.target.value)} placeholder="10% off all meals" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eligibility">Eligibility</Label>
          <Input id="eligibility" value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="Valid student ID required" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promoCode">Promo code (optional)</Label>
          <Input id="promoCode" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="redemptionInstructions">Redemption instructions</Label>
        <Textarea id="redemptionInstructions" rows={2} value={redemptionInstructions} onChange={(e) => setRedemptionInstructions(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="locations">Locations / branches</Label>
          <Input id="locations" value={locations} onChange={(e) => setLocations(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiresAt">Valid until (optional)</Label>
          <Input id="expiresAt" type="date" value={expiresAt ?? ""} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactInfo">Contact info</Label>
          <Input id="contactInfo" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="externalUrl">External URL (optional)</Label>
          <Input id="externalUrl" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="terms">Terms (optional)</Label>
        <Textarea id="terms" rows={2} value={terms ?? ""} onChange={(e) => setTerms(e.target.value)} />
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={submitting || !merchantName.trim() || !description.trim() || !discountSummary.trim()} onClick={(e) => handleSubmit(e, false)}>
          Save as draft
        </Button>
        <Button type="button" disabled={submitting || !merchantName.trim() || !description.trim() || !discountSummary.trim()} onClick={(e) => handleSubmit(e, true)}>
          {submitting ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}
