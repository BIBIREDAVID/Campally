import { redirect } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listCampusContentAdmin } from "@/lib/queries/campus";
import { CampusStatusBadge } from "@/components/campus/campus-status-badge";
import { AdminContentCard } from "@/components/admin/admin-content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { CAMPUS_CATEGORY_LABELS } from "@/types/domain";

export default async function AdminCampusPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "campus.manage")) redirect("/");

  const { data: articles } = await listCampusContentAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Campus Information</h1>
        <LinkButton href="/admin/campus/new" className="gap-2">
          <Plus size={16} /> New article
        </LinkButton>
      </div>

      {articles.length === 0 ? (
        <EmptyState icon={BookOpen} title="No campus content yet" description="Add your first handbook article for students." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <AdminContentCard
              key={a.id}
              href={`/admin/campus/${a.id}`}
              title={a.title}
              fallbackIcon={BookOpen}
              category={CAMPUS_CATEGORY_LABELS[a.category]}
              statusBadge={<CampusStatusBadge status={a.status} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
