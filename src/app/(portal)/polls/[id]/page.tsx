import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/current-user";
import { getPollDetail, getPollResults, getViewerVote } from "@/lib/queries/polls";
import { PollVote } from "@/components/polls/poll-vote";
import { PollStatusBadge } from "@/components/polls/poll-badges";

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const { data: poll } = await getPollDetail(id);
  if (!poll || poll.status === "draft") notFound();

  const [results, viewerVote] = await Promise.all([
    getPollResults(id),
    getViewerVote(id, user?.profile.id),
  ]);

  const isOpen = poll.status === "published" && (!poll.closes_at || new Date(poll.closes_at) > new Date());

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{poll.question}</h1>
          {poll.description && <p className="mt-1 text-sm text-muted-foreground">{poll.description}</p>}
        </div>
        <PollStatusBadge status={poll.status} />
      </div>

      {poll.closes_at && (
        <p className="text-xs text-muted-foreground">
          {isOpen ? "Closes" : "Closed"} {new Date(poll.closes_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <PollVote
          poll={poll}
          results={results}
          viewerVote={viewerVote}
          isAuthenticated={!!user}
          isOpen={isOpen}
        />
      </div>
    </div>
  );
}
