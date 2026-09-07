"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { voteAction } from "@/lib/actions/polls";
import type { Poll, PollResult } from "@/types/domain";

interface Props {
  poll: Poll;
  results: PollResult[];
  viewerVote: string | null;
  isAuthenticated: boolean;
  isOpen: boolean;
}

export function PollVote({ poll, results, viewerVote, isAuthenticated, isOpen }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localVote, setLocalVote] = useState(viewerVote);

  const totalVotes = results.reduce((sum, r) => sum + Number(r.votes), 0);
  const showResults = !isOpen || !!localVote;

  function handleVote(optionId: string) {
    setError(null);
    startTransition(async () => {
      const result = await voteAction(poll.id, optionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLocalVote(optionId);
      router.refresh();
    });
  }

  if (showResults) {
    return (
      <div className="flex flex-col gap-2.5">
        {results.map((r) => {
          const pct = totalVotes ? Math.round((Number(r.votes) / totalVotes) * 100) : 0;
          const isMine = localVote === r.option_id;
          return (
            <div key={r.option_id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className={isMine ? "flex items-center gap-1.5 font-semibold" : "font-medium"}>
                  {isMine && <Check size={14} className="text-primary" />}
                  {r.label}
                </span>
                <span className="text-muted-foreground">
                  {r.votes} ({pct}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <p className="mt-1 text-xs text-muted-foreground">{totalVotes} total votes</p>
        {isOpen && localVote && (
          <p className="text-xs text-muted-foreground">You voted for this poll. Tap another option to change your vote.</p>
        )}
        {isOpen && localVote && (
          <div className="mt-1 flex flex-wrap gap-2">
            {poll.poll_options?.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={pending || o.id === localVote}
                onClick={() => handleVote(o.id)}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-primary disabled:opacity-40"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        <a href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </a>{" "}
        to vote in this poll.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {poll.poll_options?.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={pending}
          onClick={() => handleVote(o.id)}
          className="rounded-xl border border-border px-4 py-3 text-left text-sm font-medium hover:border-primary hover:bg-muted/40 disabled:opacity-50"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
