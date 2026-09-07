import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listEventsAdmin } from "@/lib/queries/events";
import { EventStatusBadge } from "@/components/events/event-badges";
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
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">No events yet</p>
          <p className="mt-1 text-sm">Create your first campus event.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">RSVPs</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-primary">
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{EVENT_CATEGORY_LABELS[e.category]}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(e.start_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.rsvp_count ?? 0}
                    {e.capacity ? ` / ${e.capacity}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <EventStatusBadge status={e.status} />
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
