"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addCaseCommentAction } from "@/lib/actions/cases";
import type { CaseComment } from "@/types/domain";

interface Props {
  caseId: string;
  publicComments: CaseComment[];
  internalComments: CaseComment[];
}

export function AdminCommentPanels({ caseId, internalComments }: Props) {
  const router = useRouter();
  const [publicBody, setPublicBody] = useState("");
  const [internalBody, setInternalBody] = useState("");
  const [submittingPublic, setSubmittingPublic] = useState(false);
  const [submittingInternal, setSubmittingInternal] = useState(false);

  async function handlePublicSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicBody.trim()) return;
    setSubmittingPublic(true);
    await addCaseCommentAction(caseId, publicBody, false);
    setSubmittingPublic(false);
    setPublicBody("");
    router.refresh();
  }

  async function handleInternalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!internalBody.trim()) return;
    setSubmittingInternal(true);
    await addCaseCommentAction(caseId, internalBody, true);
    setSubmittingInternal(false);
    setInternalBody("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <form onSubmit={handlePublicSubmit} className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Reply to student (visible to them)
        </p>
        <Textarea
          value={publicBody}
          onChange={(e) => setPublicBody(e.target.value)}
          placeholder="Write a public reply..."
          rows={2}
        />
        <Button type="submit" size="sm" disabled={submittingPublic || !publicBody.trim()} className="w-fit">
          {submittingPublic ? "Sending..." : "Send reply"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 rounded-xl border border-amber-300/50 bg-amber-50 p-4 dark:bg-amber-950/20">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Internal notes — staff only, never shown to the student
        </p>

        <ul className="flex flex-col gap-2">
          {internalComments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-semibold">
                {c.users?.first_name} {c.users?.last_name}:
              </span>{" "}
              {c.body}
            </li>
          ))}
          {internalComments.length === 0 && (
            <p className="text-sm text-amber-700/70 dark:text-amber-400/70">No internal notes yet.</p>
          )}
        </ul>

        <form onSubmit={handleInternalSubmit} className="flex flex-col gap-2">
          <Textarea
            value={internalBody}
            onChange={(e) => setInternalBody(e.target.value)}
            placeholder="Add an internal note..."
            rows={2}
            className="bg-white dark:bg-black/20"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={submittingInternal || !internalBody.trim()}
            className="w-fit border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-400"
          >
            {submittingInternal ? "Saving..." : "Add note"}
          </Button>
        </form>
      </div>
    </div>
  );
}
