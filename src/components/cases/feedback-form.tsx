"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitCaseFeedbackAction } from "@/lib/actions/cases";
import { cn } from "@/lib/utils";

export function FeedbackForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    await submitCaseFeedbackAction(caseId, rating, "");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
      <p className="text-sm font-medium">How was your resolution?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}>
            <Star
              size={24}
              className={cn("text-muted-foreground", n <= rating && "fill-primary text-primary")}
            />
          </button>
        ))}
      </div>
      <Button size="sm" disabled={rating === 0 || submitting} onClick={handleSubmit}>
        {submitting ? "Submitting..." : "Submit rating"}
      </Button>
    </div>
  );
}
