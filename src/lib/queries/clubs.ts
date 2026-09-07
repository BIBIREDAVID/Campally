import { createClient } from "@/lib/supabase/server";
import type { ClubCategory, ClubMembership, ClubRecord, ClubAnnouncement, EventRecord } from "@/types/domain";

async function withViewerMeta(clubs: ClubRecord[], viewerId?: string) {
  if (clubs.length === 0) return clubs;

  const supabase = await createClient();
  const clubIds = clubs.map((c) => c.id);

  const [{ data: follows }, { data: memberships }] = await Promise.all([
    supabase.from("club_follows").select("club_id, user_id").in("club_id", clubIds),
    viewerId
      ? supabase.from("club_memberships").select("club_id, user_id, status").in("club_id", clubIds).eq("user_id", viewerId)
      : Promise.resolve({ data: [] as { club_id: string; user_id: string; status: string }[] }),
  ]);

  const followerCounts = new Map<string, number>();
  const viewerFollows = new Set<string>();
  for (const f of follows ?? []) {
    followerCounts.set(f.club_id, (followerCounts.get(f.club_id) ?? 0) + 1);
    if (viewerId && f.user_id === viewerId) viewerFollows.add(f.club_id);
  }

  const membershipByClub = new Map<string, string>();
  for (const m of memberships ?? []) membershipByClub.set(m.club_id, m.status);

  return clubs.map((c) => ({
    ...c,
    follower_count: followerCounts.get(c.id) ?? 0,
    viewer_follows: viewerFollows.has(c.id),
    viewer_membership_status: (membershipByClub.get(c.id) as ClubRecord["viewer_membership_status"]) ?? null,
  }));
}

export interface ClubFilters {
  category?: ClubCategory;
  q?: string;
}

export async function listPublishedClubs(filters: ClubFilters = {}, viewerId?: string) {
  const supabase = await createClient();
  let query = supabase.from("clubs").select("*").eq("status", "published").order("name", { ascending: true });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.q) query = query.ilike("name", `%${filters.q}%`);

  const { data, error } = await query;
  const clubs = await withViewerMeta((data ?? []) as ClubRecord[], viewerId);
  return { data: clubs, error };
}

export async function getClubDetail(id: string, viewerId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clubs").select("*").eq("id", id).single();
  if (!data) return { data: null, error };

  const [withMeta] = await withViewerMeta([data as ClubRecord], viewerId);
  return { data: withMeta, error };
}

export async function listClubUpcomingEvents(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("club_id", clubId)
    .eq("status", "published")
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(5);
  return { data: (data ?? []) as EventRecord[], error };
}

export async function listClubAnnouncements(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_announcements")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(10);
  return { data: (data ?? []) as ClubAnnouncement[], error };
}

export async function listFollowedClubs(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_follows")
    .select("clubs(*)")
    .eq("user_id", userId);
  const clubs = (data ?? []).map((row) => row.clubs).filter(Boolean) as unknown as ClubRecord[];
  return { data: clubs, error };
}

export interface ClubAdminFilters {
  status?: string;
}

export async function listClubsAdmin(filters: ClubAdminFilters = {}) {
  const supabase = await createClient();
  let query = supabase.from("clubs").select("*").order("name", { ascending: true });
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  const clubs = await withViewerMeta((data ?? []) as ClubRecord[]);
  return { data: clubs, error };
}

export async function getClubForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clubs").select("*").eq("id", id).single();
  return { data: data as ClubRecord | null, error };
}

export async function isClubAdmin(userId: string, clubId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_admins")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export interface ClubAdminRow {
  id: string;
  user_id: string;
  users: { first_name: string; last_name: string; school_email: string };
}

export async function listClubAdmins(clubId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_admins")
    .select("id, user_id, users:user_id(first_name, last_name, school_email)")
    .eq("club_id", clubId);
  return { data: (data ?? []) as unknown as ClubAdminRow[], error };
}

export async function listClubMemberships(clubId: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("club_memberships")
    .select("*, users:user_id(first_name, last_name, school_email)")
    .eq("club_id", clubId)
    .order("requested_at", { ascending: true });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  return { data: (data ?? []) as ClubMembership[], error };
}
