import { createClient } from "@/lib/supabase/server";
import type { Poll, PollResult } from "@/types/domain";

export async function listPublishedPolls() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Poll[], error };
}

export async function getPollDetail(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("id", id)
    .single();
  if (!data) return { data: null, error };
  (data.poll_options as { position: number }[])?.sort((a, b) => a.position - b.position);
  return { data: data as Poll, error };
}

export async function getPollResults(pollId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("poll_results", { p_poll_id: pollId });
  return (data ?? []) as PollResult[];
}

export async function getViewerVote(pollId: string, userId?: string) {
  if (!userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.option_id ?? null;
}

export async function listPollsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .order("created_at", { ascending: false });
  return { data: (data ?? []) as Poll[], error };
}

export async function getPollForEdit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("polls").select("*, poll_options(*)").eq("id", id).single();
  return { data: data as Poll | null, error };
}
