import { createClient } from "@/lib/supabase/server";
import type { CampusContent, CampusContentCategory, CampusContentStatus } from "@/types/domain";

export async function listPublishedCampusContent(search?: string, category?: CampusContentCategory) {
  const supabase = await createClient();
  let query = supabase
    .from("campus_content")
    .select("*")
    .eq("status", "published")
    .order("category")
    .order("sort_order")
    .order("title");

  if (category) query = query.eq("category", category);
  if (search?.trim()) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as CampusContent[], error };
}

export async function getCampusContentDetail(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("campus_content").select("*").eq("id", id).single();
  return { data: data as CampusContent | null, error };
}

export interface CampusContentAdminFilters {
  status?: CampusContentStatus;
  category?: CampusContentCategory;
}

export async function listCampusContentAdmin(filters: CampusContentAdminFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("campus_content")
    .select("*")
    .order("category")
    .order("sort_order")
    .order("title");

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);

  const { data, error } = await query;
  return { data: (data ?? []) as CampusContent[], error };
}
