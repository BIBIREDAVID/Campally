"use server";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { checkIpRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { isSchoolEmail, isValidMatricNumber } from "@/lib/validation";

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
  // 5 signups per hour per IP blocks scripted account creation while
  // leaving plenty of room for a shared campus NAT/wifi.
  const allowed = await checkIpRateLimit("signup", 5, 3600);
  if (!allowed) return { error: "Too many signup attempts. Please try again later." };

  const supabase = await createClient();

  // Validate the school email domain against the tenant's configured domain.
  const { data: tenant } = await supabase
    .from("tenants")
    .select("student_email_domain")
    .eq("slug", "demo-university")
    .single();

  if (!isSchoolEmail(input.schoolEmail, tenant?.student_email_domain)) {
    return { error: `Please use your school email ending in ${tenant?.student_email_domain}` };
  }

  if (!isValidMatricNumber(input.matricNumber)) {
    return { error: "Enter a valid matric number." };
  }

  const siteUrl = getSiteUrl();

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
  // Keyed by email (not just IP) so one address can't be spammed with
  // confirmation emails from multiple IPs, and one IP can't burn through
  // many addresses.
  const allowedForEmail = await checkRateLimit("resend_confirmation", email.toLowerCase(), 3, 600);
  if (!allowedForEmail) return { error: "Too many resend attempts. Please wait a few minutes." };
  const allowedForIp = await checkIpRateLimit("resend_confirmation", 10, 600);
  if (!allowedForIp) return { error: "Too many resend attempts. Please wait a few minutes." };

  const supabase = await createClient();
  const siteUrl = getSiteUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function loginAction(email: string, password: string) {
  // Keyed by email+IP together so brute-forcing one account from one IP is
  // capped, without letting a single IP's failed guesses against many
  // different accounts blow through a shared bucket.
  const allowed = await checkIpRateLimit(`login:${email.toLowerCase()}`, 8, 300);
  if (!allowed) return { error: "Too many login attempts. Please wait a few minutes and try again." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
