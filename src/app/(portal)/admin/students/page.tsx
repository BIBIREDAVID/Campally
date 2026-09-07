import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listStudents } from "@/lib/queries/admin";
import { StudentSearch } from "@/components/admin/student-search";
import { EmptyState } from "@/components/shared/empty-state";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "students.view")) redirect("/");

  const { q } = await searchParams;
  const { data: students } = await listStudents({ q });
  const canManageRoles = hasPermission(user, "roles.manage");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold">Students</h1>

      <StudentSearch initialQuery={q} />

      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" description="Try a different search." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Matric No.</th>
                <th className="px-4 py-3">Verified</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    {canManageRoles ? (
                      <Link href={`/admin/students/${s.id}`} className="font-medium hover:text-primary">
                        {s.first_name} {s.last_name}
                      </Link>
                    ) : (
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.school_email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.matric_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.is_verified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
