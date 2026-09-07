"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPollAction, updatePollAction } from "@/lib/actions/polls";
import type { Poll } from "@/types/domain";

interface Props {
  existing?: Poll;
}

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PollForm({ existing }: Props) {
  const router = useRouter();
  const [question, setQuestion] = useState(existing?.question ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [closesAt, setClosesAt] = useState(toLocalDatetimeInput(existing?.closes_at ?? null));
  const [options, setOptions] = useState<string[]>(
    existing?.poll_options?.length ? existing.poll_options.map((o) => o.label) : ["", ""]
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      question,
      description,
      closesAt: closesAt ? new Date(closesAt).toISOString() : null,
      options,
    };

    const status = publish ? ("published" as const) : ("draft" as const);
    const result = existing
      ? await updatePollAction(existing.id, input, status)
      : await createPollAction(input, status);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/polls");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="question">Question</Label>
        <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Options</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Remove option ${i + 1}`}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="w-fit gap-1.5" onClick={() => setOptions((p) => [...p, ""])}>
          <Plus size={14} /> Add option
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="closesAt">Closes (optional)</Label>
        <Input id="closesAt" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting || !question.trim()}
          onClick={(e) => handleSubmit(e, false)}
        >
          Save as draft
        </Button>
        <Button type="button" disabled={submitting || !question.trim()} onClick={(e) => handleSubmit(e, true)}>
          {submitting ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}
