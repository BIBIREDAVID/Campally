"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import type { AnnouncementAudience, AnnouncementCategory, AnnouncementPriority } from "@/types/domain";

export interface AnnouncementInput {
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  audienceType: AnnouncementAudience;
  audienceFacultyId?: string | null;
  expiresAt?: string | null;
  publishAt?: string | null; // if set and in the future -> scheduled; if omitted -> draft
  coverImageUrl?: string | null;
}

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAnnouncementCoverAction(formData: FormData) {
  const user = await getCurrentUser();
  const permError = requireNewsManage(user);
  if (permError) return { error: permError };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (file.size > MAX_COVER_BYTES) return { error: "Image is too large (max 5MB)." };
  if (!ALLOWED_COVER_TYPES.includes(file.type)) return { error: "Only JPG, PNG, or WebP images are supported." };

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("news-covers").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("news-covers").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

function requireNewsManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "news.manage")) return "You don't have permission to manage announcements.";
  return null;
}

export async function createAnnouncementAction(input: AnnouncementInput) {
  const user = await getCurrentUser();
  const permError = requireNewsManage(user);
  if (permError) return { error: permError };

  if (input.audienceType === "faculty" && !input.audienceFacultyId) {
    return { error: "Select a faculty for this audience." };
  }
  if (!input.title.trim() || !input.body.trim()) {
    return { error: "Title and body are required." };
  }

  const now = new Date();
  const publishAt = input.publishAt ? new Date(input.publishAt) : null;
  const status = !publishAt ? "draft" : publishAt > now ? "scheduled" : "published";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      tenant_id: user!.profile.tenant_id,
      title: input.title,
      body: input.body,
      category: input.category,
      priority: input.priority,
      audience_type: input.audienceType,
      audience_faculty_id: input.audienceType === "faculty" ? input.audienceFacultyId : null,
      published_at: publishAt?.toISOString() ?? null,
      expires_at: input.expiresAt || null,
      cover_image_url: input.coverImageUrl || null,
      status,
      author_id: user!.profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
  return { success: true, id: data.id };
}

export async function updateAnnouncementAction(id: string, input: AnnouncementInput) {
  const user = await getCurrentUser();
  const permError = requireNewsManage(user);
  if (permError) return { error: permError };

  if (input.audienceType === "faculty" && !input.audienceFacultyId) {
    return { error: "Select a faculty for this audience." };
  }

  const now = new Date();
  const publishAt = input.publishAt ? new Date(input.publishAt) : null;
  const status = !publishAt ? "draft" : publishAt > now ? "scheduled" : "published";

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({
      title: input.title,
      body: input.body,
      category: input.category,
      priority: input.priority,
      audience_type: input.audienceType,
      audience_faculty_id: input.audienceType === "faculty" ? input.audienceFacultyId : null,
      published_at: publishAt?.toISOString() ?? null,
      expires_at: input.expiresAt || null,
      cover_image_url: input.coverImageUrl || null,
      status,
      last_edited_by: user!.profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/news");
  revalidatePath(`/admin/news/${id}`);
  revalidatePath("/news");
  revalidatePath(`/news/${id}`);
  revalidatePath("/");
  return { success: true };
}

export async function archiveAnnouncementAction(id: string) {
  const user = await getCurrentUser();
  const permError = requireNewsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ status: "archived", last_edited_by: user!.profile.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/");
  return { success: true };
}
