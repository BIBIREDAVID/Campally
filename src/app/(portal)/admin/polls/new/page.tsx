import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { PollForm } from "@/components/polls/poll-form";

export default async function NewPollPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "polls.manage")) redirect("/");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/polls" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to polls
      </Link>
      <h1 className="text-xl font-bold">New poll</h1>
      <PollForm />
    </div>
  );
}
