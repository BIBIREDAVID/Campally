import { createClient } from "@/lib/supabase/server";
import type { DealCategory, DealRecord } from "@/types/domain";

async function withViewerMeta(deals: DealRecord[], viewerId?: string) {
  if (deals.length === 0 || !viewerId) return deals;

  const supabase = await createClient();
  const { data: favourites } = await supabase
    .from("deal_favourites")
    .select("deal_id")
    .eq("user_id", viewerId)
    .in("deal_id", deals.map((d) => d.id));

  const saved = new Set((favourites ?? []).map((f) => f.deal_id));
  return deals.map((d) => ({ ...d, viewer_has_saved: saved.has(d.id) }));
}

export interface DealFilters {
  category?: DealCategory;
  q?: string;
  savedOnly?: boolean;
}

export async function listPublishedDeals(filters: DealFilters = {}, viewerId?: string) {
  const supabase = await createClient();

  if (filters.savedOnly && viewerId) {
    const { data: favourites } = await supabase.from("deal_favourites").select("deal_id").eq("user_id", viewerId);
    const ids = (favourites ?? []).map((f) => f.deal_id);
    if (ids.length === 0) return { data: [], error: null };

    let query = supabase
      .from("deals")
      .select("*")
      .eq("status", "published")
      .in("id", ids)
      .order("merchant_name", { ascending: true });
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.q) query = query.ilike("merchant_name", `%${filters.q}%`);

    const { data, error } = await query;
    const deals = await withViewerMeta((data ?? []) as DealRecord[], viewerId);
    return { data: deals, error };
  }

  let query = supabase
    .from("deals")
    .select("*")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString().slice(0, 10)}`)
    .order("merchant_name", { ascending: true });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.q) query = query.ilike("merchant_name", `%${filters.q}%`);

  const { data, error } = await query;
  const deals = await withViewerMeta((data ?? []) as DealRecord[], viewerId);
  return { data: deals, error };
}

export async function getDealDetail(id: string, viewerId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("deals").select("*").eq("id", id).single();
  if (!data) return { data: null, error };

  // Counts anonymous browsing too — public visitors are a real audience
  // for merchant engagement numbers, not just logged-in students.
  await supabase.rpc("increment_deal_views", { deal_id: id });

  const [withMeta] = await withViewerMeta([data as DealRecord], viewerId);
  return { data: withMeta, error };
}

export interface DealAdminFilters {
  status?: string;
}

export async function listDealsAdmin(filters: DealAdminFilters = {}) {
  const supabase = await createClient();
  let query = supabase.from("deals").select("*").order("merchant_name", { ascending: true });
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  return { data: (data ?? []) as DealRecord[], error };
}

export async function getDealForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("deals").select("*").eq("id", id).single();
  return { data: data as DealRecord | null, error };
}
