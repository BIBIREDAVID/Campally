"use server";

import { createClient } from "@/lib/supabase/server";

export interface SignUpInput {
  firstName: string;
  lastName: string;
  schoolEmail: string;
  matricNumber: string;
  password: string;
  facultyId: string;
  departmentId: string;
  programmeId?: string;
  academicLevelId: string;
}

export async function signUpAction(input: SignUpInput) {
  const supabase = await createClient();

  // Validate the school email domain against the tenant's configured domain.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("student_email_domain")
    .eq("slug", "demo-university")
    .single();

  if (
    tenant?.student_email_domain &&
    !input.schoolEmail.toLowerCase().endsWith(tenant.student_email_domain.toLowerCase())
  ) {
    return { error: `Please use your school email ending in ${tenant.student_email_domain}` };
  }

  if (!/^[A-Za-z0-9/-]{4,20}$/.test(input.matricNumber)) {
    return { error: "Enter a valid matric number." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email: input.schoolEmail,
    password: input.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        matric_number: input.matricNumber,
        faculty_id: input.facultyId,
        department_id: input.departmentId,
        programme_id: input.programmeId || null,
        academic_level_id: input.academicLevelId,
      },
    },
  });

  if (error) return { error: error.message };
  return { success: true, email: input.schoolEmail };
}

export async function resendConfirmationAction(email: string) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
