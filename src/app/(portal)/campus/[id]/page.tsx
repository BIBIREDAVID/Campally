import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { getCampusContentDetail } from "@/lib/queries/campus";
import { CAMPUS_CATEGORY_LABELS } from "@/types/domain";

export default async function CampusContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: article } = await getCampusContentDetail(id);
  if (!article || article.status !== "published") notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/campus" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to Campus Information
      </Link>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {CAMPUS_CATEGORY_LABELS[article.category]}
        </p>
        <h1 className="text-lg font-bold">{article.title}</h1>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{article.body}</p>
      </div>
    </div>
  );
}
