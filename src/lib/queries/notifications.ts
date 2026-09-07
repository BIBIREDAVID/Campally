import { createClient } from "@/lib/supabase/server";
import type { NotificationRecord } from "@/types/domain";

export async function listNotifications(userId: string, limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data ?? []) as NotificationRecord[], error };
}

export async function countUnreadNotifications(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}
