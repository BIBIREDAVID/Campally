"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import type { DealCategory, DealStatus } from "@/types/domain";

export interface DealInput {
  merchantName: string;
  category: DealCategory;
  description: string;
  discountSummary: string;
  eligibility?: string | null;
  promoCode?: string | null;
  redemptionInstructions?: string | null;
  locations?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  terms?: string | null;
  contactInfo?: string | null;
  externalUrl?: string | null;
  logoUrl?: string | null;
}

function requireDealsManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "deals.manage")) return "You don't have permission to manage deals.";
  return null;
}

function toRow(input: DealInput, status: DealStatus) {
  return {
    merchant_name: input.merchantName,
    category: input.category,
    description: input.description,
    discount_summary: input.discountSummary,
    eligibility: input.eligibility || null,
    promo_code: input.promoCode || null,
    redemption_instructions: input.redemptionInstructions || null,
    locations: input.locations || null,
    starts_at: input.startsAt || null,
    expires_at: input.expiresAt || null,
    terms: input.terms || null,
    contact_info: input.contactInfo || null,
    external_url: input.externalUrl || null,
    logo_url: input.logoUrl || null,
    status,
  };
}

export async function createDealAction(input: DealInput, status: DealStatus) {
  const user = await getCurrentUser();
  const permError = requireDealsManage(user);
  if (permError) return { error: permError };

  if (!input.merchantName.trim() || !input.description.trim() || !input.discountSummary.trim()) {
    return { error: "Merchant name, description, and discount are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .insert({ tenant_id: user!.profile.tenant_id, author_id: user!.profile.id, ...toRow(input, status) })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/deals");
  revalidatePath("/deals");
  return { success: true, id: data.id };
}

export async function updateDealAction(id: string, input: DealInput, status: DealStatus) {
  const user = await getCurrentUser();
  const permError = requireDealsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update({ last_edited_by: user!.profile.id, updated_at: new Date().toISOString(), ...toRow(input, status) })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/deals");
  revalidatePath(`/admin/deals/${id}`);
  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return { success: true };
}

export async function archiveDealAction(id: string) {
  const user = await getCurrentUser();
  const permError = requireDealsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deals")
    .update({ status: "archived", last_edited_by: user!.profile.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/deals");
  revalidatePath("/deals");
  return { success: true };
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadDealLogoAction(formData: FormData) {
  const user = await getCurrentUser();
  const permError = requireDealsManage(user);
  if (permError) return { error: permError };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image is too large (max 5MB)." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { error: "Only JPG, PNG, or WebP images are supported." };

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("deal-images").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("deal-images").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function saveDealAction(dealId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase.from("deal_favourites").insert({ deal_id: dealId, user_id: user.profile.id });
  if (error) {
    if (error.code === "23505") return { error: "You've already saved this deal." };
    return { error: error.message };
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  return { success: true };
}

export async function unsaveDealAction(dealId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("deal_favourites")
    .delete()
    .eq("deal_id", dealId)
    .eq("user_id", user.profile.id);

  if (error) return { error: error.message };

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  return { success: true };
}
