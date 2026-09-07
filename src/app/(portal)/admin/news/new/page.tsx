import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getAcademicStructure } from "@/lib/queries/academic";
import { AnnouncementForm } from "@/components/news/announcement-form";

export default async function NewAnnouncementPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "news.manage")) redirect("/");

  const { faculties } = await getAcademicStructure();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/news" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to news
      </Link>
      <h1 className="text-xl font-bold">New announcement</h1>
      <AnnouncementForm faculties={faculties} />
    </div>
  );
}
