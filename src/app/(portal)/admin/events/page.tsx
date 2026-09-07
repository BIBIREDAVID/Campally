import { redirect } from "next/navigation";
import { Plus, CalendarDays } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listEventsAdmin } from "@/lib/queries/events";
import { EventStatusBadge } from "@/components/events/event-badges";
import { AdminContentCard } from "@/components/admin/admin-content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { EVENT_CATEGORY_LABELS } from "@/types/domain";

export default async function AdminEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "events.manage")) redirect("/");

  const { data: events } = await listEventsAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Events</h1>
        <LinkButton href="/admin/events/new" className="gap-2">
          <Plus size={16} /> New event
        </LinkButton>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events yet" description="Create your first campus event." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <AdminContentCard
              key={e.id}
              href={`/admin/events/${e.id}`}
              title={e.title}
              imageUrl={e.cover_image_url}
              fallbackIcon={CalendarDays}
              category={EVENT_CATEGORY_LABELS[e.category]}
              meta={`${new Date(e.start_at).toLocaleDateString(undefined, { dateStyle: "medium" })} · ${e.rsvp_count ?? 0}${e.capacity ? ` / ${e.capacity}` : ""} RSVPs`}
              statusBadge={<EventStatusBadge status={e.status} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
