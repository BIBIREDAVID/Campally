import { redirect } from "next/navigation";
import { Plus, Megaphone } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listAnnouncementsAdmin } from "@/lib/queries/news";
import { AnnouncementStatusBadge, UrgentBadge } from "@/components/news/announcement-badges";
import { AdminContentCard } from "@/components/admin/admin-content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { ANNOUNCEMENT_CATEGORY_LABELS } from "@/types/domain";

export default async function AdminNewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "news.manage")) redirect("/");

  const { data: announcements } = await listAnnouncementsAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">News & Announcements</h1>
        <LinkButton href="/admin/news/new" className="gap-2">
          <Plus size={16} /> New announcement
        </LinkButton>
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Publish your first update to reach students." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {announcements.map((a) => (
            <AdminContentCard
              key={a.id}
              href={`/admin/news/${a.id}`}
              title={a.title}
              imageUrl={a.cover_image_url}
              fallbackIcon={Megaphone}
              category={ANNOUNCEMENT_CATEGORY_LABELS[a.category]}
              meta={a.audience_type === "everyone" ? "Everyone" : (a.faculties?.name ?? "Faculty")}
              statusBadge={
                <div className="flex flex-col items-end gap-1">
                  <AnnouncementStatusBadge status={a.status} />
                  <UrgentBadge priority={a.priority} />
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
