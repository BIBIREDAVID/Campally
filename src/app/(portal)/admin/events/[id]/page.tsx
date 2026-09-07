import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getEventForEdit, listEventRsvps } from "@/lib/queries/events";
import { listFaculties } from "@/lib/queries/academic";
import { EventForm } from "@/components/events/event-form";
import { CancelEventButton } from "@/components/events/cancel-event-button";
import { EventStatusBadge } from "@/components/events/event-badges";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "events.manage")) redirect("/");

  const [{ data: event }, { data: rsvps }, faculties] = await Promise.all([
    getEventForEdit(id),
    listEventRsvps(id),
    listFaculties(),
  ]);
  if (!event) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/events" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to events
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Edit event</h1>
          <EventStatusBadge status={event.status} />
        </div>
        {event.status !== "cancelled" && <CancelEventButton id={id} />}
      </div>

      <EventForm existing={event} faculties={faculties} />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">
          RSVPs ({rsvps.length}
          {event.capacity ? ` / ${event.capacity}` : ""})
        </h2>
        {rsvps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rsvps.map((r) => (
              <li key={r.id} className="text-sm">
                {r.users?.first_name} {r.users?.last_name} — {r.users?.school_email}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
