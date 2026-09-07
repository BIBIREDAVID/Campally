"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitCaseAction } from "@/lib/actions/cases";
import { CaseAttachments } from "@/components/cases/case-attachments";
import { enqueueCase } from "@/lib/offline-case-queue";
import type { CaseCategory } from "@/types/domain";

export function SubmitCaseForm({ categories }: { categories: CaseCategory[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ referenceNumber: string; caseId: string } | null>(
    null
  );
  const [queued, setQueued] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const caseInput = {
      categoryId,
      title,
      description,
      location,
      isAnonymous: isAnonymous && !!selectedCategory?.allow_anonymous,
    };

    // No connectivity: never even attempt the network call — queue
    // immediately so the student gets an honest "queued" state instead of
    // watching a submit button hang.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueCase(caseInput);
      setSubmitting(false);
      setQueued(true);
      return;
    }

    let result;
    try {
      result = await submitCaseAction(caseInput);
    } catch {
      // A network-level failure (not a validation error from the server) —
      // most likely a flaky or just-dropped connection. Queue rather than
      // show a dead-end error the student can't act on.
      enqueueCase(caseInput);
      setSubmitting(false);
      setQueued(true);
      return;
    }
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirmation({ referenceNumber: result.referenceNumber!, caseId: result.caseId! });
  }

  if (queued) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <h2 className="text-lg font-bold">Case queued</h2>
        <p className="text-sm text-muted-foreground">
          You&apos;re offline, so this case hasn&apos;t been submitted yet — it&apos;s saved on this device and
          will send automatically the next time you&apos;re back online.
        </p>
        <Button className="mt-2" variant="outline" onClick={() => router.push("/cases")}>
          Back to cases
        </Button>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <h2 className="text-lg font-bold">Case submitted</h2>
        <p className="text-sm text-muted-foreground">
          Reference number: <span className="font-mono font-semibold text-foreground">{confirmation.referenceNumber}</span>
        </p>
        <p className="text-sm text-muted-foreground">You&apos;ll be notified of any updates here.</p>

        <div className="w-full text-left">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Add a photo or document (optional)</p>
          <CaseAttachments caseId={confirmation.caseId} attachments={[]} canUpload />
        </div>

        <Button className="mt-2" onClick={() => router.push(`/cases/${confirmation.caseId}`)}>
          View case
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <Select
          items={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId}
          onValueChange={(v) => setCategoryId(v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.is_sensitive && <span className="ml-1 text-[10px] text-muted-foreground">(sensitive)</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>

      {selectedCategory?.allow_anonymous && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Submit anonymously
          <span className="text-xs font-normal text-muted-foreground">
            — only Welfare officers can see who submitted this
          </span>
        </label>
      )}

      <Button type="submit" disabled={submitting || !categoryId} className="mt-1">
        {submitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
