"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCaseCommentAction } from "@/lib/actions/cases";

export function ReplyForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = await addCaseCommentAction(caseId, body, false);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-border pt-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a reply..."
        rows={2}
      />
      <Button type="submit" disabled={submitting || !body.trim()} className="w-fit">
        {submitting ? "Sending..." : "Reply"}
      </Button>
    </form>
  );
}
