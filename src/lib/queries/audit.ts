import { createClient } from "@/lib/supabase/server";
import type { AuditLogEntry } from "@/types/domain";

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  q?: string;
}

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select("*, users:actor_id(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);

  const { data, error } = await query;
  let logs = (data ?? []) as AuditLogEntry[];

  if (filters.q) {
    const q = filters.q.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q) ||
        `${l.users?.first_name ?? ""} ${l.users?.last_name ?? ""}`.toLowerCase().includes(q)
    );
  }

  return { data: logs, error };
}

export async function listAuditActions() {
  const supabase = await createClient();
  const { data } = await supabase.from("audit_logs").select("action").limit(1000);
  return Array.from(new Set((data ?? []).map((r) => r.action))).sort();
}
