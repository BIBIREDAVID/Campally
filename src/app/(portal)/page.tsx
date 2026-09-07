import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone, UserPlus, CalendarDays, Users, Tag } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { getCurrentUser, isAdminUser } from "@/lib/queries/current-user";
import { listMyCases } from "@/lib/queries/cases";
import { getUrgentAnnouncement, listPublishedAnnouncements } from "@/lib/queries/news";
import { listPublishedEvents } from "@/lib/queries/events";
import { listFollowedClubs } from "@/lib/queries/clubs";
import { listPublishedDeals } from "@/lib/queries/deals";
import { StatusBadge } from "@/components/shared/status-badge";
import { PreviewRow } from "@/components/shared/preview-row";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (isAdminUser(user)) redirect("/admin");

  const [
    caseData,
    urgentAnnouncement,
    { data: latestAnnouncements },
    { data: todaysEvents },
    followedClubsData,
    { data: latestDeals },
  ] = await Promise.all([
    user ? listMyCases(user.profile.id) : Promise.resolve({ data: [] }),
    getUrgentAnnouncement(),
    listPublishedAnnouncements(4),
    listPublishedEvents({ when: "today" }, user?.profile.id),
    user ? listFollowedClubs(user.profile.id) : Promise.resolve({ data: [] }),
    listPublishedDeals({}, user?.profile.id),
  ]);
  const openCases = caseData.data.filter((c) => !["resolved", "closed", "rejected"].includes(c.status));
  const followedClubs = followedClubsData.data;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {user ? (
        <div>
          <h1 className="text-xl font-bold">Hi, {user.profile.first_name} 👋</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s going on.</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-border p-6 sm:p-10">
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: "var(--illo-coral)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--illo-blue)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full opacity-15 blur-3xl"
            style={{ background: "var(--illo-mint)" }}
            aria-hidden="true"
          />
          <div className="relative flex max-w-lg flex-col gap-3">
            <Logo size={48} priority />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome to Union</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                The LASU Students&apos; Union, in your pocket &mdash; cases, events, clubs, news, and deals in one place.
              </p>
            </div>
            <LinkButton href="/signup" className="mt-1 w-fit">
              Sign up free
            </LinkButton>
          </div>
        </div>
      )}

      {urgentAnnouncement && (
        <Link
          href={`/news/${urgentAnnouncement.id}`}
          className="flex items-start gap-3 rounded-2xl border border-[var(--status-urgent)]/30 bg-[color-mix(in_oklch,var(--status-urgent)_8%,transparent)] p-4 shadow-sm"
        >
          <Megaphone size={18} className="mt-0.5 shrink-0 text-[var(--status-urgent)]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--status-urgent)]">Urgent</p>
            <p className="text-sm font-semibold">{urgentAnnouncement.title}</p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {user ? (
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Your open cases</h2>
              <Link href="/cases" className="text-xs font-semibold text-primary">
                See all
              </Link>
            </div>

            {openCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open cases right now.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {openCases.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cases/${c.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary"
                    >
                      <span className="text-sm font-medium">{c.title}</span>
                      <StatusBadge status={c.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <LinkButton href="/cases/new" className="w-fit gap-2">
              <Plus size={16} /> Submit a Case
            </LinkButton>
          </Card>
        ) : (
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus size={18} />
              </span>
              <div>
                <h2 className="text-sm font-bold">Have an issue on campus?</h2>
                <p className="text-xs text-muted-foreground">Sign up to submit and track a case with the Student Union.</p>
              </div>
            </div>
            <LinkButton href="/signup" className="w-fit">
              Sign up
            </LinkButton>
          </Card>
        )}

        <Card className="flex flex-col gap-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Today&apos;s events</h2>
            <Link href="/events" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>

          {todaysEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events today.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {todaysEvents.slice(0, 3).map((e) => (
                <PreviewRow
                  key={e.id}
                  href={`/events/${e.id}`}
                  title={e.title}
                  meta={new Date(e.start_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
                  imageUrl={e.cover_image_url}
                  fallbackIcon={CalendarDays}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Latest news</h2>
            <Link href="/news" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>

          {latestAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No news yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {latestAnnouncements.slice(0, 3).map((a) => (
                <PreviewRow
                  key={a.id}
                  href={`/news/${a.id}`}
                  title={a.title}
                  imageUrl={a.cover_image_url}
                  fallbackIcon={Megaphone}
                />
              ))}
            </div>
          )}
        </Card>

        {user && followedClubs.length > 0 && (
          <Card className="flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Clubs you follow</h2>
              <Link href="/clubs" className="text-xs font-semibold text-primary">
                See all
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {followedClubs.slice(0, 3).map((c) => (
                <PreviewRow
                  key={c.id}
                  href={`/clubs/${c.id}`}
                  title={c.name}
                  imageUrl={c.cover_image_url ?? c.logo_url}
                  fallbackIcon={Users}
                />
              ))}
            </div>
          </Card>
        )}

        <Card className="flex flex-col gap-2 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">New student deals</h2>
            <Link href="/deals" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>

          {latestDeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {latestDeals.slice(0, 3).map((d) => (
                <PreviewRow
                  key={d.id}
                  href={`/deals/${d.id}`}
                  title={d.merchant_name}
                  meta={d.discount_summary}
                  imageUrl={d.logo_url}
                  fallbackIcon={Tag}
                />
              ))}
            </div>
          )}
        </Card>

        {!user && (
          <Card className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <h2 className="text-sm font-bold">Get the full Union experience</h2>
            <p className="max-w-xs text-xs text-muted-foreground">
              Sign up with your school email to RSVP to events, follow clubs, save deals, and submit cases.
            </p>
            <LinkButton href="/signup" className="mt-1">
              Sign up free
            </LinkButton>
          </Card>
        )}
      </div>
    </div>
  );
}
