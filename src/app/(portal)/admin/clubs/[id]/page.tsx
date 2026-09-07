import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getClubForEdit, isClubAdmin, listClubAdmins, listClubMemberships } from "@/lib/queries/clubs";
import { ClubForm } from "@/components/clubs/club-form";
import { ArchiveClubButton } from "@/components/clubs/archive-club-button";
import { ClubStatusBadge } from "@/components/clubs/club-badges";
import { MembershipRequestsPanel } from "@/components/clubs/membership-requests-panel";
import { ClubAnnouncementForm } from "@/components/clubs/club-announcement-form";
import { ClubAdminsPanel } from "@/components/clubs/club-admins-panel";

export default async function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canManageGlobally = hasPermission(user, "clubs.manage");
  const isScopedAdmin = canManageGlobally ? false : await isClubAdmin(user.profile.id, id);
  if (!canManageGlobally && !isScopedAdmin) redirect("/");

  const [{ data: club }, { data: pendingRequests }, { data: clubAdmins }] = await Promise.all([
    getClubForEdit(id),
    listClubMemberships(id, "pending"),
    canManageGlobally ? listClubAdmins(id) : Promise.resolve({ data: [] }),
  ]);
  if (!club) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/clubs" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to clubs
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Edit club</h1>
          <ClubStatusBadge status={club.status} />
        </div>
        {canManageGlobally && club.status !== "archived" && <ArchiveClubButton id={id} />}
      </div>

      <ClubForm existing={club} />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">Membership requests</h2>
        <MembershipRequestsPanel clubId={id} requests={pendingRequests} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">Post an announcement to followers</h2>
        <ClubAnnouncementForm clubId={id} />
      </div>

      {canManageGlobally && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Club administrators</h2>
          <ClubAdminsPanel clubId={id} admins={clubAdmins ?? []} />
        </div>
      )}
    </div>
  );
}
