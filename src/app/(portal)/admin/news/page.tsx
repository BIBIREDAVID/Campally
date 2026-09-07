import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listAnnouncementsAdmin } from "@/lib/queries/news";
import { AnnouncementStatusBadge, UrgentBadge } from "@/components/news/announcement-badges";
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
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">No announcements yet</p>
          <p className="mt-1 text-sm">Publish your first update to reach students.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Audience</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/news/${a.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                      {a.title}
                      <UrgentBadge priority={a.priority} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ANNOUNCEMENT_CATEGORY_LABELS[a.category]}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.audience_type === "everyone" ? "Everyone" : a.faculties?.name ?? "Faculty"}
                  </td>
                  <td className="px-4 py-3">
                    <AnnouncementStatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
