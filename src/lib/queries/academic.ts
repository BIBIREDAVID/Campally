import { createClient } from "@/lib/supabase/server";
import type { AcademicLevel, Department, Faculty, Programme } from "@/types/domain";

export async function getAcademicStructure() {
  const supabase = await createClient();

  const [{ data: faculties }, { data: departments }, { data: programmes }, { data: levels }] =
    await Promise.all([
      supabase.from("faculties").select("id, name").order("name"),
      supabase.from("departments").select("id, faculty_id, name").order("name"),
      supabase.from("programmes").select("id, department_id, name").order("name"),
      supabase.from("academic_levels").select("id, name, sort_order").order("sort_order"),
    ]);

  return {
    faculties: (faculties ?? []) as Faculty[],
    departments: (departments ?? []) as Department[],
    programmes: (programmes ?? []) as Programme[],
    levels: (levels ?? []) as AcademicLevel[],
  };
}
