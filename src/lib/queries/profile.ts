import { createClient } from "@/lib/supabase/server";

export interface ProfileDetail {
  first_name: string;
  last_name: string;
  school_email: string;
  matric_number: string;
  phone: string | null;
  faculties: { name: string } | null;
  departments: { name: string } | null;
  programmes: { name: string } | null;
  academic_levels: { name: string } | null;
}

export async function getMyProfileDetail(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "first_name, last_name, school_email, matric_number, phone, faculties:faculty_id(name), departments:department_id(name), programmes:programme_id(name), academic_levels:academic_level_id(name)"
    )
    .eq("id", userId)
    .single();

  return { data: data as ProfileDetail | null, error };
}
