import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { CampusContentForm } from "@/components/campus/campus-content-form";

export default async function NewCampusContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "campus.manage")) redirect("/");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/campus" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to Campus Information
      </Link>
      <h1 className="text-xl font-bold">New article</h1>
      <CampusContentForm />
    </div>
  );
}
