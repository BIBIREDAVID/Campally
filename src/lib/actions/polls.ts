"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import type { PollStatus } from "@/types/domain";

export interface PollInput {
  question: string;
  description?: string | null;
  closesAt?: string | null;
  options: string[];
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

  const options = input.options.map((o) => o.trim()).filter(Boolean);
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

  const options = input.options.map((o) => o.trim()).filter(Boolean);
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

  // Replace options wholesale — simplest correct approach for a poll that
  // hasn't collected votes yet; once published, admins are expected to
  // close and open a new poll rather than reshape a live one.
  await supabase.from("poll_options").delete().eq("poll_id", id);
  const { error: optError } = await supabase
    .from("poll_options")
    .insert(options.map((label, i) => ({ poll_id: id, label, position: i })));
  if (optError) return { error: optError.message };

  revalidatePath("/admin/polls");
  revalidatePath(`/admin/polls/${id}`);
  revalidatePath("/polls");
  revalidatePath(`/polls/${id}`);
  return { id };
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
