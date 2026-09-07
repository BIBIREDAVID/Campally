"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { checkRateLimit } from "@/lib/rate-limit";
import type { PollStatus } from "@/types/domain";

export interface PollOptionInput {
  id?: string;
  label: string;
}

export interface PollInput {
  question: string;
  description?: string | null;
  closesAt?: string | null;
  options: PollOptionInput[];
}

function requirePollsManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "polls.manage")) return "You don't have permission to manage polls.";
  return null;
}

export async function createPollAction(input: PollInput, status: PollStatus) {
  const user = await getCurrentUser();
  const permError = requirePollsManage(user);
  if (permError) return { error: permError };

  const options = input.options.map((o) => o.label.trim()).filter(Boolean);
  if (!input.question.trim()) return { error: "A question is required." };
  if (options.length < 2) return { error: "Add at least two options." };

  const supabase = await createClient();
  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      tenant_id: user!.profile.tenant_id,
      question: input.question,
      description: input.description || null,
      closes_at: input.closesAt || null,
      author_id: user!.profile.id,
      status,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const { error: optError } = await supabase.from("poll_options").insert(
    options.map((label, i) => ({ poll_id: poll.id, label, position: i }))
  );
  if (optError) return { error: optError.message };

  revalidatePath("/admin/polls");
  revalidatePath("/polls");
  return { id: poll.id as string };
}

export async function updatePollAction(id: string, input: PollInput, status: PollStatus) {
  const user = await getCurrentUser();
  const permError = requirePollsManage(user);
  if (permError) return { error: permError };

  const options = input.options.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label);
  if (!input.question.trim()) return { error: "A question is required." };
  if (options.length < 2) return { error: "Add at least two options." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("polls")
    .update({
      question: input.question,
      description: input.description || null,
      closes_at: input.closesAt || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Diff against existing options rather than delete-and-reinsert
  // everything — a wholesale replace silently wiped votes (poll_votes
  // cascades on poll_options delete) even when an admin was just fixing a
  // typo. Existing options keep their id (and their votes); only options
  // the admin actually removed lose their votes, which is the correct
  // behaviour for a genuinely removed choice.
  const { data: existing } = await supabase.from("poll_options").select("id").eq("poll_id", id);
  const existingIds = new Set((existing ?? []).map((o) => o.id));
  const keptIds = new Set(options.filter((o) => o.id).map((o) => o.id));

  const removedIds = Array.from(existingIds).filter((eid) => !keptIds.has(eid));
  if (removedIds.length > 0) {
    await supabase.from("poll_options").delete().in("id", removedIds);
  }

  const toUpdate = options.filter((o) => o.id && existingIds.has(o.id));
  for (const [i, o] of toUpdate.entries()) {
    await supabase.from("poll_options").update({ label: o.label, position: i }).eq("id", o.id!);
  }

  const toInsert = options.filter((o) => !o.id || !existingIds.has(o.id));
  if (toInsert.length > 0) {
    const startPos = toUpdate.length;
    const { error: optError } = await supabase
      .from("poll_options")
      .insert(toInsert.map((o, i) => ({ poll_id: id, label: o.label, position: startPos + i })));
    if (optError) return { error: optError.message };
  }

  revalidatePath("/admin/polls");
  revalidatePath(`/admin/polls/${id}`);
  revalidatePath("/polls");
  revalidatePath(`/polls/${id}`);
  return { id };
}

export async function duplicatePollAction(id: string) {
  const user = await getCurrentUser();
  const permError = requirePollsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { data: original } = await supabase.from("polls").select("*, poll_options(*)").eq("id", id).single();
  if (!original) return { error: "Poll not found." };

  const { data: copy, error } = await supabase
    .from("polls")
    .insert({
      tenant_id: user!.profile.tenant_id,
      question: `${original.question} (copy)`,
      description: original.description,
      author_id: user!.profile.id,
      status: "draft",
    })
    .select()
    .single();
  if (error) return { error: error.message };

  const options = (original.poll_options as { label: string; position: number }[]) ?? [];
  if (options.length > 0) {
    await supabase.from("poll_options").insert(
      options
        .sort((a, b) => a.position - b.position)
        .map((o, i) => ({ poll_id: copy.id, label: o.label, position: i }))
    );
  }

  revalidatePath("/admin/polls");
  return { id: copy.id as string };
}

export async function closePollAction(id: string) {
  const user = await getCurrentUser();
  const permError = requirePollsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase.from("polls").update({ status: "closed" }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/polls");
  revalidatePath("/polls");
  revalidatePath(`/polls/${id}`);
  return { success: true };
}

export async function voteAction(pollId: string, optionId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  // One vote per person is DB-enforced, but nothing stopped rapid-fire
  // delete/re-insert vote flipping — cap it well above any real
  // change-of-mind usage.
  const allowed = await checkRateLimit("poll_vote", user.profile.id, 20, 60);
  if (!allowed) return { error: "Too many vote changes. Please slow down." };

  const supabase = await createClient();
  // Remove any prior vote first — a viewer can change their mind while a
  // poll is still open, one vote per person is enforced at the DB level.
  await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", user.profile.id);

  const { error } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionId, user_id: user.profile.id });
  if (error) return { error: error.message };

  revalidatePath(`/polls/${pollId}`);
  return { success: true };
}
