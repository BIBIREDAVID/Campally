"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import type { CampusContentCategory, CampusContentStatus } from "@/types/domain";

export interface CampusContentInput {
  title: string;
  body: string;
  category: CampusContentCategory;
  status: CampusContentStatus;
  sortOrder?: number;
}

function requireCampusManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "campus.manage")) return "You don't have permission to manage Campus Information.";
  return null;
}

export async function createCampusContentAction(input: CampusContentInput) {
  const user = await getCurrentUser();
  const permError = requireCampusManage(user);
  if (permError) return { error: permError };

  if (!input.title.trim() || !input.body.trim()) {
    return { error: "Title and body are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campus_content")
    .insert({
      tenant_id: user!.profile.tenant_id,
      title: input.title,
      body: input.body,
      category: input.category,
      status: input.status,
      sort_order: input.sortOrder ?? 0,
      author_id: user!.profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/campus");
  revalidatePath("/campus");
  return { success: true, id: data.id };
}

export async function updateCampusContentAction(id: string, input: CampusContentInput) {
  const user = await getCurrentUser();
  const permError = requireCampusManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("campus_content")
    .update({
      title: input.title,
      body: input.body,
      category: input.category,
      status: input.status,
      sort_order: input.sortOrder ?? 0,
      last_edited_by: user!.profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/campus");
  revalidatePath(`/admin/campus/${id}`);
  revalidatePath("/campus");
  revalidatePath(`/campus/${id}`);
  return { success: true };
}

export async function archiveCampusContentAction(id: string) {
  const user = await getCurrentUser();
  const permError = requireCampusManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("campus_content")
    .update({ status: "archived", last_edited_by: user!.profile.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/campus");
  revalidatePath("/campus");
  return { success: true };
}
