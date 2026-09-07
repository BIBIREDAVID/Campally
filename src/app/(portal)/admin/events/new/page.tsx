import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listFaculties } from "@/lib/queries/academic";
import { EventForm } from "@/components/events/event-form";

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "events.manage")) redirect("/");

  const faculties = await listFaculties();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/events" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to events
      </Link>
      <h1 className="text-xl font-bold">New event</h1>
      <EventForm faculties={faculties} />
    </div>
  );
}
