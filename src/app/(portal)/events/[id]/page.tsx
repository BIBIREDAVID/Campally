import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, User, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { getEventDetail } from "@/lib/queries/events";
import { RsvpButton } from "@/components/events/rsvp-button";
import { LinkButton } from "@/components/ui/link-button";
import { EVENT_CATEGORY_LABELS } from "@/types/domain";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const { data: event } = await getEventDetail(id, user?.profile.id);
  if (!event || event.status === "draft") notFound();

  const isFull = !!event.capacity && (event.rsvp_count ?? 0) >= event.capacity;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/events" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to events
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {event.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
          <img src={event.cover_image_url} alt="" className="h-48 w-full rounded-xl object-cover" />
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {EVENT_CATEGORY_LABELS[event.category]}
          </p>
          <h1 className="text-lg font-bold">{event.title}</h1>
        </div>

        {event.status === "cancelled" && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            This event has been cancelled.
          </p>
        )}

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Calendar size={14} />
            {new Date(event.start_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
            {event.end_at && ` – ${new Date(event.end_at).toLocaleTimeString(undefined, { timeStyle: "short" })}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-2">
              <MapPin size={14} /> {event.location}
            </span>
          )}
          {event.organiser && (
            <span className="flex items-center gap-2">
              <User size={14} /> Organised by {event.organiser}
            </span>
          )}
          {event.rsvp_enabled && (
            <span className="flex items-center gap-2">
              <Users size={14} />
              {event.rsvp_count ?? 0}
              {event.capacity ? ` / ${event.capacity}` : ""} going
            </span>
          )}
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{event.description}</p>

        {event.contact_person && (
          <p className="text-xs text-muted-foreground">Contact: {event.contact_person}</p>
        )}

        {event.status === "published" && event.rsvp_enabled && (
          user ? (
            <RsvpButton eventId={id} initialRsvped={!!event.viewer_has_rsvped} isFull={isFull} />
          ) : (
            <LinkButton href="/signup" className="w-fit">
              Sign up to RSVP
            </LinkButton>
          )
        )}
      </div>
    </div>
  );
}
