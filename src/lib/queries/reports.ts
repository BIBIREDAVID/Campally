import { createClient } from "@/lib/supabase/server";

export interface CaseCategoryCount {
  name: string;
  count: number;
}

export interface ResolutionStats {
  resolvedCount: number;
  medianHours: number | null;
}

export interface RankedItem {
  id: string;
  label: string;
  metric: number;
}

export interface CronJobStatus {
  job_name: string;
  schedule: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
}

export async function getCronJobStatus(): Promise<CronJobStatus[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_cron_job_status");
  return (data ?? []) as CronJobStatus[];
}

export async function getCasesByCategory(): Promise<CaseCategoryCount[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("cases").select("case_categories(name)");

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const name = (row.case_categories as unknown as { name: string } | null)?.name ?? "Uncategorised";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getResolutionStats(): Promise<ResolutionStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("created_at, resolved_at")
    .eq("status", "resolved")
    .not("resolved_at", "is", null);

  const hours = (data ?? [])
    .map((c) => (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60))
    .sort((a, b) => a - b);

  if (hours.length === 0) return { resolvedCount: 0, medianHours: null };

  const mid = Math.floor(hours.length / 2);
  const medianHours = hours.length % 2 === 0 ? (hours[mid - 1] + hours[mid]) / 2 : hours[mid];

  return { resolvedCount: hours.length, medianHours };
}

export async function getFeedbackSummary() {
  const supabase = await createClient();
  const { data } = await supabase.from("case_feedback").select("rating");
  const ratings = (data ?? []).map((r) => r.rating).filter((r): r is number => r != null);
  if (ratings.length === 0) return { count: 0, average: null as number | null };
  return { count: ratings.length, average: ratings.reduce((a, b) => a + b, 0) / ratings.length };
}

export async function getTopEventsByRsvp(limit = 5): Promise<RankedItem[]> {
  const supabase = await createClient();
  const { data: events } = await supabase.from("events").select("id, title").eq("status", "published");
  if (!events || events.length === 0) return [];

  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .in("event_id", events.map((e) => e.id));

  const counts = new Map<string, number>();
  for (const r of rsvps ?? []) counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);

  return events
    .map((e) => ({ id: e.id, label: e.title, metric: counts.get(e.id) ?? 0 }))
    .filter((e) => e.metric > 0)
    .sort((a, b) => b.metric - a.metric)
    .slice(0, limit);
}

export async function getTopClubsByFollowers(limit = 5): Promise<RankedItem[]> {
  const supabase = await createClient();
  const { data: clubs } = await supabase.from("clubs").select("id, name").eq("status", "published");
  if (!clubs || clubs.length === 0) return [];

  const { data: follows } = await supabase
    .from("club_follows")
    .select("club_id")
    .in("club_id", clubs.map((c) => c.id));

  const counts = new Map<string, number>();
  for (const f of follows ?? []) counts.set(f.club_id, (counts.get(f.club_id) ?? 0) + 1);

  return clubs
    .map((c) => ({ id: c.id, label: c.name, metric: counts.get(c.id) ?? 0 }))
    .filter((c) => c.metric > 0)
    .sort((a, b) => b.metric - a.metric)
    .slice(0, limit);
}

export async function getTopDealsByEngagement(limit = 5): Promise<(RankedItem & { views: number; saves: number })[]> {
  const supabase = await createClient();
  const { data: deals } = await supabase.from("deals").select("id, merchant_name, views").eq("status", "published");
  if (!deals || deals.length === 0) return [];

  const { data: favourites } = await supabase
    .from("deal_favourites")
    .select("deal_id")
    .in("deal_id", deals.map((d) => d.id));

  const saveCounts = new Map<string, number>();
  for (const f of favourites ?? []) saveCounts.set(f.deal_id, (saveCounts.get(f.deal_id) ?? 0) + 1);

  return deals
    .map((d) => ({
      id: d.id,
      label: d.merchant_name,
      views: d.views,
      saves: saveCounts.get(d.id) ?? 0,
      metric: d.views + (saveCounts.get(d.id) ?? 0) * 3,
    }))
    .filter((d) => d.metric > 0)
    .sort((a, b) => b.metric - a.metric)
    .slice(0, limit);
}
