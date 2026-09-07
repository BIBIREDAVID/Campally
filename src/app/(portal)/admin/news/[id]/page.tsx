import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getAnnouncementForEdit } from "@/lib/queries/news";
import { getAcademicStructure } from "@/lib/queries/academic";
import { AnnouncementForm } from "@/components/news/announcement-form";
import { ArchiveAnnouncementButton } from "@/components/news/archive-announcement-button";
import { AnnouncementStatusBadge } from "@/components/news/announcement-badges";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "news.manage")) redirect("/");

  const [{ data: announcement }, { faculties }] = await Promise.all([
    getAnnouncementForEdit(id),
    getAcademicStructure(),
  ]);
  if (!announcement) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/news" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to news
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Edit announcement</h1>
          <AnnouncementStatusBadge status={announcement.status} />
        </div>
        {announcement.status !== "archived" && <ArchiveAnnouncementButton id={id} />}
      </div>

      <AnnouncementForm faculties={faculties} existing={announcement} />
    </div>
  );
}
