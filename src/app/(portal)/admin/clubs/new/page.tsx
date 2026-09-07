import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { ClubForm } from "@/components/clubs/club-form";

export default async function NewClubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "clubs.manage")) redirect("/");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/clubs" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to clubs
      </Link>
      <h1 className="text-xl font-bold">New club</h1>
      <ClubForm />
    </div>
  );
}
