import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getPollForEdit, getPollResults } from "@/lib/queries/polls";
import { PollForm } from "@/components/polls/poll-form";
import { ClosePollButton } from "@/components/polls/close-poll-button";
import { DuplicatePollButton } from "@/components/polls/duplicate-poll-button";
import { PollStatusBadge } from "@/components/polls/poll-badges";

export default async function EditPollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "polls.manage")) redirect("/");

  const { data: poll } = await getPollForEdit(id);
  if (!poll) notFound();

  const results = poll.status !== "draft" ? await getPollResults(id) : [];
  const totalVotes = results.reduce((sum, r) => sum + Number(r.votes), 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/polls" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to polls
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Edit poll</h1>
          <PollStatusBadge status={poll.status} />
        </div>
        <div className="flex gap-2">
          <DuplicatePollButton id={id} />
          {poll.status === "published" && <ClosePollButton id={id} />}
        </div>
      </div>

      <PollForm existing={poll} />

      {totalVotes > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Results ({totalVotes} votes)</h2>
          <div className="flex flex-col gap-2.5">
            {results.map((r) => {
              const pct = totalVotes ? Math.round((Number(r.votes) / totalVotes) * 100) : 0;
              return (
                <div key={r.option_id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{r.label}</span>
                    <span className="text-muted-foreground">{r.votes} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
