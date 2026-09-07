import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listClubsAdmin } from "@/lib/queries/clubs";
import { ClubStatusBadge } from "@/components/clubs/club-badges";
import { AdminContentCard } from "@/components/admin/admin-content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { CLUB_CATEGORY_LABELS } from "@/types/domain";

export default async function AdminClubsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "clubs.manage")) redirect("/");

  const { data: clubs } = await listClubsAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Clubs</h1>
        <LinkButton href="/admin/clubs/new" className="gap-2">
          <Plus size={16} /> New club
        </LinkButton>
      </div>

      {clubs.length === 0 ? (
        <EmptyState icon={Users} title="No clubs yet" description="Create the first recognised club or society." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <AdminContentCard
              key={c.id}
              href={`/admin/clubs/${c.id}`}
              title={c.name}
              imageUrl={c.cover_image_url ?? c.logo_url}
              fallbackIcon={Users}
              category={CLUB_CATEGORY_LABELS[c.category]}
              meta={`${c.follower_count ?? 0} follower${c.follower_count === 1 ? "" : "s"}`}
              statusBadge={<ClubStatusBadge status={c.status} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
