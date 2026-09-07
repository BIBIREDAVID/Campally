import { createClient } from "@/lib/supabase/server";
import { isOverdue } from "@/lib/queries/cases";
import type { CaseRecord } from "@/types/domain";

export async function listStaffUsers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("user_type", "staff")
    .order("first_name");
  return data ?? [];
}

export interface StudentDirectoryFilters {
  q?: string;
}

export async function listStudents(filters: StudentDirectoryFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select("id, first_name, last_name, school_email, matric_number, user_type, is_verified")
    .order("first_name");

  if (filters.q) {
    query = query.or(
      `first_name.ilike.%${filters.q}%,last_name.ilike.%${filters.q}%,school_email.ilike.%${filters.q}%,matric_number.ilike.%${filters.q}%`
    );
  }

  const { data, error } = await query.limit(100);
  return { data: data ?? [], error };
}

export async function getStudentWithRoles(userId: string) {
  const supabase = await createClient();
  const [{ data: student }, { data: assignedRoles }, { data: allRoles }] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, last_name, school_email, matric_number, user_type, is_verified, tenant_id")
      .eq("id", userId)
      .single(),
    supabase.from("user_roles").select("role_id, roles(id, name)").eq("user_id", userId),
    supabase.from("roles").select("id, name").order("name"),
  ]);

  return {
    student,
    assignedRoleIds: new Set((assignedRoles ?? []).map((r) => r.role_id)),
    allRoles: allRoles ?? [],
  };
}

export async function getDashboardMetrics() {
  const supabase = await createClient();

  const [{ count: totalStudents }, { count: openCases }, { count: resolvedCases }, { data: statusRows }, { data: openCaseRows }] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("user_type", "student"),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .not("status", "in", "(resolved,closed,rejected)"),
      supabase.from("cases").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      supabase.from("cases").select("status"),
      supabase
        .from("cases")
        .select("status, updated_at")
        .not("status", "in", "(resolved,closed,rejected)"),
    ]);

  const statusCounts: Record<string, number> = {};
  for (const row of statusRows ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  const overdueCases = ((openCaseRows ?? []) as Pick<CaseRecord, "status" | "updated_at">[]).filter(isOverdue).length;

  return {
    totalStudents: totalStudents ?? 0,
    openCases: openCases ?? 0,
    resolvedCases: resolvedCases ?? 0,
    overdueCases,
    statusCounts,
  };
}
