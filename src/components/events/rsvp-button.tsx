"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelRsvpAction, rsvpToEventAction } from "@/lib/actions/events";

interface Props {
  eventId: string;
  initialRsvped: boolean;
  isFull: boolean;
}

export function RsvpButton({ eventId, initialRsvped, isFull }: Props) {
  const router = useRouter();
  const [rsvped, setRsvped] = useState(initialRsvped);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    // RSVP/cancel are reversible, low-stakes actions — optimistic UI is fine
    // here (unlike case submission), per the Phase 3 rule on which actions
    // may update the UI before server confirmation.
    const wasRsvped = rsvped;
    setRsvped(!wasRsvped);

    const result = wasRsvped ? await cancelRsvpAction(eventId) : await rsvpToEventAction(eventId);
    setSubmitting(false);

    if (result.error) {
      setRsvped(wasRsvped);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!rsvped && isFull) {
    return <Button disabled>Event full</Button>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        type="button"
        variant={rsvped ? "outline" : "default"}
        onClick={handleClick}
        disabled={submitting}
        className="gap-1.5"
      >
        {rsvped && <Check size={15} />}
        {rsvped ? "You're going" : "RSVP"}
      </Button>
    </div>
  );
}
