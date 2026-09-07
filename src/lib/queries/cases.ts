import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/queries/current-user";
import {
  OPEN_CASE_STATUSES,
  OVERDUE_THRESHOLD_HOURS,
  type CaseAttachment,
  type CaseComment,
  type CaseHistoryEntry,
  type CaseRecord,
} from "@/types/domain";

// Anonymous cases hide the student's identity from everyone except the
// student themself (D5). Holding cases.reveal_anonymous does NOT bypass
// this mask passively — it only gates who is allowed to click "Reveal
// identity", which is a deliberate, audited action (see
// revealAnonymousIdentityAction). Masking identity here regardless of that
// permission is what makes the audit log meaningful: if we unmasked
// automatically for anyone with the permission, "reveal" would never
// actually happen as a traceable event.
function maskCaseIdentity(record: CaseRecord, viewer: CurrentUser): CaseRecord {
  if (!record.is_anonymous) return record;
  if (record.student_id === viewer.profile.id) return record;
  return { ...record, users: null };
}

function maskCommentAuthors(
  comments: CaseComment[],
  caseRecord: Pick<CaseRecord, "is_anonymous" | "student_id">,
  viewer: CurrentUser
): CaseComment[] {
  if (!caseRecord.is_anonymous) return comments;
  if (caseRecord.student_id === viewer.profile.id) return comments;

  return comments.map((c) =>
    c.author_id === caseRecord.student_id ? { ...c, users: null } : c
  );
}

export async function listMyCases(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*, case_categories(name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as CaseRecord[], error };
}

export async function getCaseDetail(id: string, viewer: CurrentUser) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*, case_categories(name), users:student_id(first_name, last_name, school_email)")
    .eq("id", id)
    .single();

  if (!data) return { data: null, error };
  return { data: maskCaseIdentity(data as CaseRecord, viewer), error };
}

export async function listCaseComments(caseId: string, caseRecord: CaseRecord, viewer: CurrentUser) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_comments")
    .select("*, users:author_id(first_name, last_name, user_type)")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  const comments = (data ?? []) as CaseComment[];
  return { data: maskCommentAuthors(comments, caseRecord, viewer), error };
}

export async function listCaseHistory(caseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_history")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  return { data: (data ?? []) as CaseHistoryEntry[], error };
}

export async function listCaseAttachments(caseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_attachments")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  return { data: (data ?? []) as CaseAttachment[], error };
}

export async function getCaseFeedback(caseId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("case_feedback").select("*").eq("case_id", caseId).maybeSingle();
  return data;
}

export async function listCaseCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_categories")
    .select("id, name, description, is_sensitive, is_active, allow_anonymous")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export interface CaseQueueFilters {
  status?: string;
  priority?: string;
  categoryId?: string;
  overdueOnly?: boolean;
}

export async function listCaseQueue(filters: CaseQueueFilters = {}, viewer: CurrentUser) {
  const supabase = await createClient();
  let query = supabase
    .from("cases")
    .select("*, case_categories(name), users:student_id(first_name, last_name, school_email)")
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);

  const { data, error } = await query;
  let cases = (data ?? []) as CaseRecord[];

  if (filters.overdueOnly) {
    cases = cases.filter((c) => isOverdue(c));
  }

  cases = cases.map((c) => maskCaseIdentity(c, viewer));
  return { data: cases, error };
}

export interface TrackedCase {
  reference_number: string;
  title: string;
  status: string;
  priority: string;
  category_name: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface TrackedCaseHistoryEntry {
  field_changed: string;
  new_value: string;
  changed_at: string;
}

export async function trackCaseByReference(referenceNumber: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("track_case_by_reference", { p_reference_number: referenceNumber })
    .maybeSingle();

  if (!data) return { data: null, history: [] as TrackedCaseHistoryEntry[], error };

  const { data: history } = await supabase.rpc("track_case_history", {
    p_reference_number: referenceNumber,
  });

  return { data: data as TrackedCase, history: (history ?? []) as TrackedCaseHistoryEntry[], error };
}

export function isOverdue(c: Pick<CaseRecord, "status" | "updated_at">): boolean {
  if (!OPEN_CASE_STATUSES.includes(c.status)) return false;
  const hoursSinceUpdate = (Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate > OVERDUE_THRESHOLD_HOURS;
}
