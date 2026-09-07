"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revealAnonymousIdentityAction } from "@/lib/actions/cases";

export function RevealIdentityButton({ caseId }: { caseId: string }) {
  const [identity, setIdentity] = useState<{ first_name: string; last_name: string; school_email: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReveal() {
    setLoading(true);
    setError(null);
    const result = await revealAnonymousIdentityAction(caseId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const revealed = Array.isArray(result.identity) ? result.identity[0] : result.identity;
    setIdentity(revealed ?? null);
  }

  if (identity) {
    return (
      <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs dark:bg-amber-950/20">
        <p className="font-semibold text-amber-800 dark:text-amber-300">
          Revealed: {identity.first_name} {identity.last_name} ({identity.school_email})
        </p>
        <p className="mt-0.5 text-amber-700/70 dark:text-amber-400/70">
          This action was recorded in the audit log.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleReveal} disabled={loading}>
        <Eye size={13} className="mr-1.5" />
        {loading ? "Revealing..." : "Reveal submitter identity"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
