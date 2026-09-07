import { createClient } from "@/lib/supabase/server";
import type { EventCategory, EventRecord, EventRsvp } from "@/types/domain";

async function withRsvpMeta(events: EventRecord[], viewerId?: string) {
  if (events.length === 0) return events;

  const supabase = await createClient();
  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("event_id, user_id")
    .in(
      "event_id",
      events.map((e) => e.id)
    );

  const counts = new Map<string, number>();
  const viewerRsvped = new Set<string>();
  for (const r of rsvps ?? []) {
    counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
    if (viewerId && r.user_id === viewerId) viewerRsvped.add(r.event_id);
  }

  return events.map((e) => ({
    ...e,
    rsvp_count: counts.get(e.id) ?? 0,
    viewer_has_rsvped: viewerRsvped.has(e.id),
  }));
}

export interface EventFilters {
  category?: EventCategory;
  when?: "today" | "week" | "upcoming";
}

export async function listPublishedEvents(filters: EventFilters = {}, viewerId?: string) {
  const supabase = await createClient();
  let query = supabase.from("events").select("*").eq("status", "published").order("start_at", { ascending: true });

  if (filters.category) query = query.eq("category", filters.category);

  const now = new Date();
  if (filters.when === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    query = query.gte("start_at", start.toISOString()).lte("start_at", end.toISOString());
  } else if (filters.when === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    query = query.gte("start_at", start.toISOString()).lt("start_at", end.toISOString());
  } else if (filters.when === "upcoming") {
    query = query.gte("start_at", now.toISOString());
  }

  const { data, error } = await query;
  const events = await withRsvpMeta((data ?? []) as EventRecord[], viewerId);
  return { data: events, error };
}

export async function getEventDetail(id: string, viewerId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (!data) return { data: null, error };

  const [withMeta] = await withRsvpMeta([data as EventRecord], viewerId);
  return { data: withMeta, error };
}

export interface EventAdminFilters {
  status?: string;
}

export async function listEventsAdmin(filters: EventAdminFilters = {}) {
  const supabase = await createClient();
  let query = supabase.from("events").select("*").order("start_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  const events = await withRsvpMeta((data ?? []) as EventRecord[]);
  return { data: events, error };
}

export async function listEventRsvps(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*, users:user_id(first_name, last_name, school_email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return { data: (data ?? []) as EventRsvp[], error };
}

export async function getEventForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  return { data: data as EventRecord | null, error };
}
