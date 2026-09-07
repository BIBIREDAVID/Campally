import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/domain";

export interface CurrentUser {
  profile: UserProfile;
  permissions: string[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .single();

  if (!profile) return null;

  const { data: rolePerms } = await supabase
    .from("user_roles")
    .select("roles(role_permissions(permissions(key)))")
    .eq("user_id", profile.id);

  const permissions = new Set<string>();
  for (const row of rolePerms ?? []) {
    const role = row.roles as unknown as {
      role_permissions: { permissions: { key: string } }[];
    } | null;
    for (const rp of role?.role_permissions ?? []) {
      permissions.add(rp.permissions.key);
    }
  }

  return { profile: profile as UserProfile, permissions: Array.from(permissions) };
}

export function hasPermission(user: CurrentUser | null, key: string): boolean {
  return !!user?.permissions.includes(key);
}

export function isStaff(user: CurrentUser | null): boolean {
  return user?.profile.user_type === "staff";
}

// Nav and routing should key off actual RBAC role assignment, not the
// separate user_type column — a student with an assigned role (e.g. a Union
// Officer who is also a student) is an admin for these purposes even though
// user_type never changes. Gated on dashboard.view specifically (not "any
// permission") so a narrowly-scoped role (e.g. a future Club Administrator
// with only club-management permissions) still lands in the normal student
// experience rather than being redirected into the admin console.
export function isAdminUser(user: CurrentUser | null): boolean {
  return isStaff(user) || hasPermission(user, "dashboard.view");
}
