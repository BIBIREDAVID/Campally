import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, AtSign, Mail, MessageCircle, Phone, Users, Globe, Settings } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getClubDetail, isClubAdmin, listClubAnnouncements, listClubUpcomingEvents } from "@/lib/queries/clubs";
import { FollowButton } from "@/components/clubs/follow-button";
import { MembershipButton } from "@/components/clubs/membership-button";
import { LinkButton } from "@/components/ui/link-button";
import { CLUB_CATEGORY_LABELS } from "@/types/domain";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: club } = await getClubDetail(id, user.profile.id);
  if (!club || club.status === "draft") notFound();

  const [{ data: upcomingEvents }, { data: announcements }, canManage] = await Promise.all([
    listClubUpcomingEvents(id),
    listClubAnnouncements(id),
    hasPermission(user, "clubs.manage") ? Promise.resolve(true) : isClubAdmin(user.profile.id, id),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link href="/clubs" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} /> Back to clubs
        </Link>
        {canManage && (
          <LinkButton href={`/admin/clubs/${id}`} variant="outline" size="sm" className="gap-1.5">
            <Settings size={13} /> Manage club
          </LinkButton>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {club.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img src={club.cover_image_url} alt="" className="h-40 w-full rounded-xl object-cover" />
        )}

        <div className="flex items-start gap-3">
          {club.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
            <img src={club.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{CLUB_CATEGORY_LABELS[club.category]}</p>
            <h1 className="text-lg font-bold">{club.name}</h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users size={13} /> {club.follower_count ?? 0} follower{club.follower_count === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{club.description}</p>

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {club.contact_email && (
            <span className="flex items-center gap-2">
              <Mail size={14} /> {club.contact_email}
            </span>
          )}
          {club.contact_phone && (
            <span className="flex items-center gap-2">
              <Phone size={14} /> {club.contact_phone}
            </span>
          )}
          {club.social_links.instagram && (
            <span className="flex items-center gap-2">
              <AtSign size={14} /> {club.social_links.instagram}
            </span>
          )}
          {club.social_links.whatsapp && (
            <span className="flex items-center gap-2">
              <MessageCircle size={14} /> {club.social_links.whatsapp}
            </span>
          )}
          {club.social_links.website && (
            <span className="flex items-center gap-2">
              <Globe size={14} /> {club.social_links.website}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <FollowButton clubId={id} initialFollowing={!!club.viewer_follows} />
          <MembershipButton clubId={id} membershipMode={club.membership_mode} initialStatus={club.viewer_membership_status ?? null} />
        </div>
      </div>

      {club.executives.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Executives</h2>
          <ul className="flex flex-col gap-1.5">
            {club.executives.map((ex, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{ex.name}</span>
                <span className="text-muted-foreground">{ex.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Upcoming events</h2>
          <ul className="flex flex-col gap-2">
            {upcomingEvents.map((e) => (
              <li key={e.id}>
                <Link href={`/events/${e.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary">
                  <span className="text-sm font-medium">{e.title}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={13} /> {new Date(e.start_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Club announcements</h2>
          <ul className="flex flex-col gap-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
