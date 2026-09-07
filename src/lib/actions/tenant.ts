"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function requireTenantManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "tenant.manage")) return "You don't have permission to edit Student Union settings.";
  return null;
}

export interface TenantBrandingInput {
  name: string;
  primaryColor: string;
  studentEmailDomain: string;
  logoUrl?: string | null;
}

export async function updateTenantBrandingAction(tenantId: string, input: TenantBrandingInput) {
  const user = await getCurrentUser();
  const permError = requireTenantManage(user);
  if (permError) return { error: permError };

  if (!input.name.trim()) return { error: "Name is required." };
  if (!/^#[0-9a-fA-F]{6}$/.test(input.primaryColor)) return { error: "Primary color must be a hex value like #3b6ef6." };
  if (!input.studentEmailDomain.trim()) return { error: "Student email domain is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      name: input.name,
      primary_color: input.primaryColor,
      student_email_domain: input.studentEmailDomain,
      logo_url: input.logoUrl || null,
    })
    .eq("id", tenantId);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadTenantLogoAction(formData: FormData) {
  const user = await getCurrentUser();
  const permError = requireTenantManage(user);
  if (permError) return { error: permError };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (file.size > MAX_LOGO_BYTES) return { error: "Image is too large (max 2MB)." };
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) return { error: "Only PNG, JPG, WebP, or SVG images are supported." };

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("tenant-branding").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("tenant-branding").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}
