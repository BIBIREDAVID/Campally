import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Megaphone, UserPlus } from "lucide-react";
import { getCurrentUser, isAdminUser } from "@/lib/queries/current-user";
import { listMyCases } from "@/lib/queries/cases";
import { getUrgentAnnouncement, listPublishedAnnouncements } from "@/lib/queries/news";
import { listPublishedEvents } from "@/lib/queries/events";
import { listFollowedClubs } from "@/lib/queries/clubs";
import { listPublishedDeals } from "@/lib/queries/deals";
import { StatusBadge } from "@/components/shared/status-badge";
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
    listPublishedAnnouncements(3),
    listPublishedEvents({ when: "today" }, user?.profile.id),
    user ? listFollowedClubs(user.profile.id) : Promise.resolve({ data: [] }),
    listPublishedDeals({}, user?.profile.id),
  ]);
  const openCases = caseData.data.filter((c) => !["resolved", "closed", "rejected"].includes(c.status));
  const followedClubs = followedClubsData.data;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">{user ? `Hi, ${user.profile.first_name} 👋` : "Welcome to Union"}</h1>
        <p className="text-sm text-muted-foreground">
          {user ? "Here's what's going on." : "Your Student Union, in your pocket."}
        </p>
      </div>

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

      {user ? (
        <Card className="flex flex-col gap-4 p-5">
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

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Today&apos;s events</h2>
          <Link href="/events" className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>

        {todaysEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events today.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todaysEvents.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${e.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary"
                >
                  <span className="text-sm font-medium">{e.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.start_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Latest news</h2>
          <Link href="/news" className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>

        {latestAnnouncements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No news yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {latestAnnouncements.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/news/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary"
                >
                  <span className="text-sm font-medium">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {user && followedClubs.length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Clubs you follow</h2>
            <Link href="/clubs" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {followedClubs.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clubs/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary"
                >
                  <span className="text-sm font-medium">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">New student deals</h2>
          <Link href="/deals" className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>

        {latestDeals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deals yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {latestDeals.slice(0, 3).map((d) => (
              <li key={d.id}>
                <Link
                  href={`/deals/${d.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:border-primary"
                >
                  <span className="text-sm font-medium">{d.merchant_name}</span>
                  <span className="text-xs text-muted-foreground">{d.discount_summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!user && (
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <h2 className="text-sm font-bold">Get the full Union experience</h2>
          <p className="max-w-xs text-xs text-muted-foreground">
            Sign up with your school email to RSVP to events, follow clubs, save deals, and submit cases to the Student Union.
          </p>
          <LinkButton href="/signup" className="mt-1">
            Sign up free
          </LinkButton>
        </Card>
      )}
    </div>
  );
}
