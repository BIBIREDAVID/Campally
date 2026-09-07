import { createClient } from "@/lib/supabase/server";
import type { Announcement, AnnouncementCategory, AnnouncementStatus } from "@/types/domain";

const PUBLIC_SELECT = "*, faculties:audience_faculty_id(name)";
const ADMIN_SELECT = "*, faculties:audience_faculty_id(name), author:author_id(first_name, last_name)";

// RLS already restricts rows to published+in-window+audience-matching (or
// news.manage holders seeing everything) — these queries just add ordering
// and the "for students" convenience shape on top of that.
export async function listPublishedAnnouncements(limit?: number, category?: AnnouncementCategory) {
  const supabase = await createClient();
  let query = supabase
    .from("announcements")
    .select(PUBLIC_SELECT)
    .eq("status", "published")
    .order("priority", { ascending: false }) // urgent first
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  return { data: (data ?? []) as Announcement[], error };
}

export async function getUrgentAnnouncement() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select(PUBLIC_SELECT)
    .eq("status", "published")
    .eq("priority", "urgent")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Announcement | null;
}

export async function getAnnouncementDetail(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("announcements").select(PUBLIC_SELECT).eq("id", id).single();
  return { data: data as Announcement | null, error };
}

export interface AnnouncementAdminFilters {
  status?: AnnouncementStatus;
}

export async function listAnnouncementsAdmin(filters: AnnouncementAdminFilters = {}) {
  const supabase = await createClient();
  let query = supabase.from("announcements").select(ADMIN_SELECT).order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  return { data: (data ?? []) as Announcement[], error };
}

export async function getAnnouncementForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("announcements").select(ADMIN_SELECT).eq("id", id).single();
  return { data: data as Announcement | null, error };
}
