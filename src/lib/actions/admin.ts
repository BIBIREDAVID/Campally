"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";

function requireRolesManage(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return "Not authenticated.";
  if (!hasPermission(user, "roles.manage")) return "You don't have permission to manage roles.";
  return null;
}

export async function assignRoleAction(userId: string, roleId: string) {
  const user = await getCurrentUser();
  const permError = requireRolesManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
  if (error) {
    if (error.code === "23505") return { error: "This student already has that role." };
    return { error: error.message };
  }

  revalidatePath(`/admin/students/${userId}`);
  return { success: true };
}

export async function revokeRoleAction(userId: string, roleId: string) {
  const user = await getCurrentUser();
  const permError = requireRolesManage(user);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/students/${userId}`);
  return { success: true };
}
