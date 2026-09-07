import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { getAnnouncementDetail } from "@/lib/queries/news";
import { UrgentBadge } from "@/components/news/announcement-badges";
import { ANNOUNCEMENT_CATEGORY_LABELS } from "@/types/domain";

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: announcement } = await getAnnouncementDetail(id);
  if (!announcement) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/news" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to news
      </Link>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {announcement.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img src={announcement.cover_image_url} alt="" className="h-48 w-full rounded-xl object-cover" />
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">{announcement.title}</h1>
          <UrgentBadge priority={announcement.priority} />
        </div>
        <p className="text-xs text-muted-foreground">
          {ANNOUNCEMENT_CATEGORY_LABELS[announcement.category]} ·{" "}
          {announcement.published_at &&
            new Date(announcement.published_at).toLocaleDateString(undefined, { dateStyle: "long" })}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{announcement.body}</p>
      </div>
    </div>
  );
}
