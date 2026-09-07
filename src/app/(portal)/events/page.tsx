import { CalendarDays } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { listPublishedEvents } from "@/lib/queries/events";
import { listFaculties } from "@/lib/queries/academic";
import { EventFilters } from "@/components/events/event-filters";
import { ContentCard } from "@/components/shared/content-card";
import { FeaturedCard } from "@/components/shared/featured-card";
import { EmptyState } from "@/components/shared/empty-state";
import { EVENT_CATEGORY_LABELS, type EventCategory } from "@/types/domain";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ when?: string; category?: string; faculty?: string }>;
}) {
  const user = await getCurrentUser();

  const { when, category, faculty } = await searchParams;
  const activeWhen = (when as "today" | "week" | "upcoming") || "upcoming";
  const [{ data: events }, faculties] = await Promise.all([
    listPublishedEvents(
      { when: activeWhen, category: category as EventCategory | undefined, facultyId: faculty },
      user?.profile.id
    ),
    listFaculties(),
  ]);

  // The soonest event in the current filter gets the featured treatment —
  // only on the default "Upcoming" view with no category filter, so a
  // filtered/narrowed list reads as a plain grid, not a demoted feature.
  const showFeatured = activeWhen === "upcoming" && !category && !faculty && events.length > 0;
  const [featured, ...rest] = showFeatured ? events : [undefined, ...events];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-xl font-bold">Events</h1>

      {featured && (
        <FeaturedCard
          href={`/events/${featured.id}`}
          title={featured.title}
          description={featured.description}
          imageUrl={featured.cover_image_url}
          eyebrow={EVENT_CATEGORY_LABELS[featured.category]}
          tags={[
            {
              label: new Date(featured.start_at).toLocaleDateString(undefined, { dateStyle: "medium" }),
            },
            ...(!featured.club_id ? [{ label: "Official" }] : []),
            ...(featured.capacity && (featured.rsvp_count ?? 0) >= featured.capacity
              ? [{ label: "Full", variant: "urgent" as const }]
              : []),
          ]}
        />
      )}

      <EventFilters activeWhen={activeWhen} activeCategory={category} activeFaculty={faculty} faculties={faculties} />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={`No events ${activeWhen === "today" ? "today" : "here"}`}
          description={activeWhen === "today" ? "Check This Week or Upcoming instead." : "Check back soon."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((e) => {
            if (!e) return null;
            const isFull = !!e.capacity && (e.rsvp_count ?? 0) >= e.capacity;
            return (
              <ContentCard
                key={e.id}
                href={`/events/${e.id}`}
                title={e.title}
                description={e.description}
                imageUrl={e.cover_image_url}
                fallbackIcon={CalendarDays}
                official={!e.club_id}
                tags={[
                  { label: EVENT_CATEGORY_LABELS[e.category] },
                  ...(isFull ? [{ label: "Full", variant: "urgent" as const }] : []),
                ]}
                meta={`${new Date(e.start_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}${e.location ? ` · ${e.location}` : ""}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
