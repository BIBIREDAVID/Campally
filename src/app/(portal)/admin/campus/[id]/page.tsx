import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getCampusContentDetail } from "@/lib/queries/campus";
import { CampusContentForm } from "@/components/campus/campus-content-form";
import { ArchiveCampusContentButton } from "@/components/campus/archive-campus-content-button";
import { CampusStatusBadge } from "@/components/campus/campus-status-badge";

export default async function EditCampusContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "campus.manage")) redirect("/");

  const { data: article } = await getCampusContentDetail(id);
  if (!article) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/campus" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to Campus Information
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Edit article</h1>
          <CampusStatusBadge status={article.status} />
        </div>
        {article.status !== "archived" && <ArchiveCampusContentButton id={id} />}
      </div>

      <CampusContentForm existing={article} />
    </div>
  );
}
