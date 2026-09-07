"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import type { ClubCategory, ClubExecutive, ClubMembershipMode, ClubSocialLinks, ClubStatus } from "@/types/domain";

export interface ClubInput {
  name: string;
  category: ClubCategory;
  description: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialLinks: ClubSocialLinks;
  executives: ClubExecutive[];
  membershipMode: ClubMembershipMode;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
}

function requireClubsManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "clubs.manage")) return "You don't have permission to manage clubs.";
  return null;
}

function toRow(input: ClubInput, status: ClubStatus) {
  return {
    name: input.name,
    category: input.category,
    description: input.description,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
    social_links: input.socialLinks,
    executives: input.executives,
    membership_mode: input.membershipMode,
    logo_url: input.logoUrl || null,
    cover_image_url: input.coverImageUrl || null,
    status,
  };
}

export async function createClubAction(input: ClubInput, status: ClubStatus) {
  const user = await getCurrentUser();
  const permError = requireClubsManage(user);
  if (permError) return { error: permError };

  if (!input.name.trim() || !input.description.trim()) {
    return { error: "Name and description are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .insert({ tenant_id: user!.profile.tenant_id, author_id: user!.profile.id, ...toRow(input, status) })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { success: true, id: data.id };
}

export async function updateClubAction(id: string, input: ClubInput, status: ClubStatus) {
  const { user, allowed } = await canManageClub(id);
  if (!allowed) return { error: "You don't have permission to manage this club." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clubs")
    .update({ last_edited_by: user!.profile.id, updated_at: new Date().toISOString(), ...toRow(input, status) })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/clubs");
  revalidatePath(`/admin/clubs/${id}`);
  revalidatePath("/clubs");
  revalidatePath(`/clubs/${id}`);
  return { success: true };
}

export async function archiveClubAction(id: string) {
  const user = await getCurrentUser();
  const permError = requireClubsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clubs")
    .update({ status: "archived", last_edited_by: user!.profile.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/clubs");
  revalidatePath("/clubs");
  return { success: true };
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadClubImageAction(formData: FormData) {
  const user = await getCurrentUser();
  const permError = requireClubsManage(user);
  if (permError) return { error: permError };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image is too large (max 5MB)." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { error: "Only JPG, PNG, or WebP images are supported." };

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from("club-images").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("club-images").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export async function followClubAction(clubId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase.from("club_follows").insert({ club_id: clubId, user_id: user.profile.id });
  if (error) {
    if (error.code === "23505") return { error: "You're already following this club." };
    return { error: error.message };
  }

  revalidatePath(`/clubs/${clubId}`);
  revalidatePath("/clubs");
  revalidatePath("/");
  return { success: true };
}

export async function unfollowClubAction(clubId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("club_follows")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.profile.id);

  if (error) return { error: error.message };

  revalidatePath(`/clubs/${clubId}`);
  revalidatePath("/clubs");
  revalidatePath("/");
  return { success: true };
}

export async function requestClubMembershipAction(clubId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("membership_mode, status").eq("id", clubId).single();
  if (!club || club.status !== "published") return { error: "This club isn't accepting members." };

  const { error } = await supabase.from("club_memberships").insert({
    club_id: clubId,
    user_id: user.profile.id,
    status: club.membership_mode === "open" ? "approved" : "pending",
    decided_at: club.membership_mode === "open" ? new Date().toISOString() : null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already requested to join this club." };
    return { error: error.message };
  }

  revalidatePath(`/clubs/${clubId}`);
  return { success: true, autoApproved: club.membership_mode === "open" };
}

export async function withdrawClubMembershipAction(clubId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("club_memberships")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.profile.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath(`/clubs/${clubId}`);
  return { success: true };
}

async function canManageClub(clubId: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, allowed: false };
  if (hasPermission(user, "clubs.manage")) return { user, allowed: true };

  const supabase = await createClient();
  const { data } = await supabase.from("club_admins").select("id").eq("club_id", clubId).eq("user_id", user.profile.id).maybeSingle();
  return { user, allowed: !!data };
}

export async function decideClubMembershipAction(membershipId: string, clubId: string, approve: boolean) {
  const { user, allowed } = await canManageClub(clubId);
  if (!allowed) return { error: "You don't have permission to manage this club's membership." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("club_memberships")
    .update({ status: approve ? "approved" : "rejected", decided_at: new Date().toISOString(), decided_by: user!.profile.id })
    .eq("id", membershipId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/clubs/${clubId}`);
  return { success: true };
}

// Only global clubs.manage holders can designate a club admin — letting a
// club admin add other club admins would be a privilege-escalation path
// with no audit step, unlike the Super Admin-only route this takes.
export async function addClubAdminAction(clubId: string, studentEmail: string) {
  const user = await getCurrentUser();
  const permError = requireClubsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("users")
    .select("id")
    .eq("school_email", studentEmail.trim().toLowerCase())
    .maybeSingle();

  if (!student) return { error: "No student found with that email." };

  const { error } = await supabase.from("club_admins").insert({ club_id: clubId, user_id: student.id });
  if (error) {
    if (error.code === "23505") return { error: "That student is already a club administrator." };
    return { error: error.message };
  }

  revalidatePath(`/admin/clubs/${clubId}`);
  return { success: true };
}

export async function removeClubAdminAction(clubAdminRowId: string, clubId: string) {
  const user = await getCurrentUser();
  const permError = requireClubsManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase.from("club_admins").delete().eq("id", clubAdminRowId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/clubs/${clubId}`);
  return { success: true };
}

export async function postClubAnnouncementAction(clubId: string, title: string, body: string) {
  const { user, allowed } = await canManageClub(clubId);
  if (!allowed) return { error: "You don't have permission to post for this club." };
  if (!title.trim() || !body.trim()) return { error: "Title and message are required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("club_announcements")
    .insert({ club_id: clubId, title, body, author_id: user!.profile.id });

  if (error) return { error: error.message };

  revalidatePath(`/admin/clubs/${clubId}`);
  revalidatePath(`/clubs/${clubId}`);
  return { success: true };
}
