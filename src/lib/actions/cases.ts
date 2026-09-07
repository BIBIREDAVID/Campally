"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/current-user";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CasePriority, CaseStatus } from "@/types/domain";

function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CASE-${year}-${random}`;
}

export interface SubmitCaseInput {
  categoryId: string;
  title: string;
  description: string;
  location?: string;
  isAnonymous: boolean;
}

export async function submitCaseAction(input: SubmitCaseInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  // 10 submissions per 10 minutes is well above any real student's need
  // (including someone retrying after fixing a validation error) and
  // blocks a compromised or scripted account from flooding the case queue.
  const allowed = await checkRateLimit("submit_case", user.profile.id, 10, 600);
  if (!allowed) return { error: "Too many cases submitted recently. Wait a few minutes and try again." };

  const supabase = await createClient();
  const referenceNumber = generateReferenceNumber();

  if (input.isAnonymous) {
    const { data: category } = await supabase
      .from("case_categories")
      .select("allow_anonymous")
      .eq("id", input.categoryId)
      .single();
    if (!category?.allow_anonymous) {
      return { error: "Anonymous submission isn't available for this category." };
    }
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      tenant_id: user.profile.tenant_id,
      reference_number: referenceNumber,
      student_id: user.profile.id,
      category_id: input.categoryId,
      title: input.title,
      description: input.description,
      location: input.location || null,
      is_anonymous: input.isAnonymous,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("case_history").insert({
    case_id: data.id,
    changed_by: user.profile.id,
    field_changed: "status",
    old_value: null,
    new_value: "submitted",
  });

  revalidatePath("/cases");
  return { success: true, caseId: data.id, referenceNumber };
}

export async function addCaseCommentAction(caseId: string, body: string, isInternal: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();

  // A public reply on a resolved/closed case reopens it to "awaiting_university".
  if (!isInternal) {
    const { data: existingCase } = await supabase
      .from("cases")
      .select("status, student_id")
      .eq("id", caseId)
      .single();

    if (
      existingCase &&
      existingCase.student_id === user.profile.id &&
      (existingCase.status === "resolved" || existingCase.status === "closed")
    ) {
      await supabase
        .from("cases")
        .update({ status: "awaiting_university", updated_at: new Date().toISOString() })
        .eq("id", caseId);

      await supabase.from("case_history").insert({
        case_id: caseId,
        changed_by: user.profile.id,
        field_changed: "status",
        old_value: existingCase.status,
        new_value: "awaiting_university",
      });
    }
  }

  const { error } = await supabase.from("case_comments").insert({
    case_id: caseId,
    author_id: user.profile.id,
    body,
    is_internal: isInternal,
  });

  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/admin/cases/${caseId}`);
  return { success: true };
}

export interface UpdateCaseInput {
  status?: CaseStatus;
  priority?: CasePriority;
  assignedTo?: string | null;
  escalatedToOffice?: string | null;
}

export async function updateCaseAction(caseId: string, input: UpdateCaseInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("cases")
    .select("status, priority, assigned_to, escalated_to_office")
    .eq("id", caseId)
    .single();

  if (fetchError || !existing) return { error: "Case not found." };

  if (input.status === "awaiting_university" && !input.escalatedToOffice && !existing.escalated_to_office) {
    return { error: "Select which university office this has been escalated to." };
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const historyRows: { field_changed: string; old_value: string | null; new_value: string | null }[] = [];

  if (input.status && input.status !== existing.status) {
    updates.status = input.status;
    if (input.status === "resolved") updates.resolved_at = new Date().toISOString();
    historyRows.push({ field_changed: "status", old_value: existing.status, new_value: input.status });
  }
  if (input.priority && input.priority !== existing.priority) {
    updates.priority = input.priority;
    historyRows.push({ field_changed: "priority", old_value: existing.priority, new_value: input.priority });
  }
  if (input.assignedTo !== undefined && input.assignedTo !== existing.assigned_to) {
    updates.assigned_to = input.assignedTo;
    historyRows.push({
      field_changed: "assigned_to",
      old_value: existing.assigned_to,
      new_value: input.assignedTo,
    });
  }
  if (input.escalatedToOffice !== undefined && input.escalatedToOffice !== existing.escalated_to_office) {
    updates.escalated_to_office = input.escalatedToOffice;
    historyRows.push({
      field_changed: "escalated_to_office",
      old_value: existing.escalated_to_office,
      new_value: input.escalatedToOffice,
    });
  }

  const { error } = await supabase.from("cases").update(updates).eq("id", caseId);
  if (error) return { error: error.message };

  if (historyRows.length > 0) {
    await supabase
      .from("case_history")
      .insert(historyRows.map((row) => ({ case_id: caseId, changed_by: user.profile.id, ...row })));
  }

  await supabase.from("audit_logs").insert({
    tenant_id: user.profile.tenant_id,
    actor_id: user.profile.id,
    action: "case.update",
    entity_type: "case",
    entity_id: caseId,
    before: existing,
    after: updates,
  });

  revalidatePath(`/admin/cases/${caseId}`);
  revalidatePath("/admin/cases");
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB — keep it light for Nigerian mobile data
const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function uploadCaseAttachmentAction(caseId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (file.size > MAX_ATTACHMENT_BYTES) return { error: "File is too large (max 8MB)." };
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return { error: "Only images and PDFs are supported." };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${caseId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("case-attachments").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("case_attachments").insert({
    case_id: caseId,
    file_url: path,
    uploaded_by: user.profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/admin/cases/${caseId}`);
  return { success: true };
}

export async function getCaseAttachmentUrlAction(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("case-attachments")
    .createSignedUrl(path, 60 * 10); // 10 minutes — attachments are private, never a public URL
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

// D5: revealing an anonymous submitter's identity is a deliberate,
// audited action — not a side effect of viewing the case.
export async function revealAnonymousIdentityAction(caseId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  if (!user.permissions.includes("cases.reveal_anonymous")) {
    return { error: "You don't have permission to reveal anonymous submitters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("student_id, is_anonymous, users:student_id(first_name, last_name, school_email)")
    .eq("id", caseId)
    .single();

  if (error || !data) return { error: "Case not found." };

  await supabase.from("audit_logs").insert({
    tenant_id: user.profile.tenant_id,
    actor_id: user.profile.id,
    action: "case.reveal_anonymous_identity",
    entity_type: "case",
    entity_id: caseId,
  });

  return { success: true, identity: data.users };
}

export async function submitCaseFeedbackAction(caseId: string, rating: number, comment: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("case_feedback").insert({ case_id: caseId, rating, comment });
  if (error) return { error: error.message };

  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}
