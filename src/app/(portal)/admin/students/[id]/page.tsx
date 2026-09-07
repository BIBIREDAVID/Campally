import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getStudentWithRoles } from "@/lib/queries/admin";
import { RoleAssignmentPanel } from "@/components/admin/role-assignment-panel";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "roles.manage")) redirect("/admin/students");

  const { student, assignedRoleIds, allRoles } = await getStudentWithRoles(id);
  if (!student) notFound();

  const assignedRoles = allRoles.filter((r) => assignedRoleIds.has(r.id));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/students" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to students
      </Link>

      <div>
        <h1 className="text-xl font-bold">{student.first_name} {student.last_name}</h1>
        <p className="text-sm text-muted-foreground">{student.school_email} &middot; {student.matric_number}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">Roles</h2>
        <RoleAssignmentPanel userId={id} allRoles={allRoles} assignedRoles={assignedRoles} />
      </div>
    </div>
  );
}
