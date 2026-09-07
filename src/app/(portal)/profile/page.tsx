import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { getMyProfileDetail } from "@/lib/queries/profile";
import { Card } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: profile } = await getMyProfileDetail(user.profile.id);

  const rows: { label: string; value: string }[] = profile
    ? [
        { label: "Name", value: `${profile.first_name} ${profile.last_name}` },
        { label: "School email", value: profile.school_email },
        { label: "Matric number", value: profile.matric_number },
        { label: "Phone", value: profile.phone ?? "Not set" },
        { label: "Faculty", value: profile.faculties?.name ?? "Not set" },
        { label: "Department", value: profile.departments?.name ?? "Not set" },
        { label: "Programme", value: profile.programmes?.name ?? "Not set" },
        { label: "Academic level", value: profile.academic_levels?.name ?? "Not set" },
      ]
    : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/more" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back
      </Link>
      <h1 className="text-xl font-bold">Profile</h1>

      <Card className="flex flex-col divide-y divide-border p-0">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-medium">{row.value}</span>
          </div>
        ))}
      </Card>

      <p className="text-xs text-muted-foreground">
        Editing your identity details isn&apos;t available yet — contact the Student Union if something here is
        wrong.
      </p>
    </div>
  );
}
