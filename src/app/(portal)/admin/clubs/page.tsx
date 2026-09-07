import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listClubsAdmin } from "@/lib/queries/clubs";
import { ClubStatusBadge } from "@/components/clubs/club-badges";
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
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">No clubs yet</p>
          <p className="mt-1 text-sm">Create the first recognised club or society.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Followers</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clubs/${c.id}`} className="font-medium hover:text-primary">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{CLUB_CATEGORY_LABELS[c.category]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.follower_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <ClubStatusBadge status={c.status} />
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
