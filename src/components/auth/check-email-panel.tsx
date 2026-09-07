"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendConfirmationAction } from "@/lib/actions/auth";

export function CheckEmailPanel({ email }: { email: string }) {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleResend() {
    setSubmitting(true);
    setError(null);
    const result = await resendConfirmationAction(email);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setResent(true);
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <MailCheck size={24} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {resent && <p className="text-sm text-emerald-600">Email resent.</p>}

      <p className="text-xs text-muted-foreground">Didn&apos;t get it? Check spam, or send again.</p>

      <Button variant="outline" onClick={handleResend} disabled={submitting || !email}>
        {submitting ? "Sending..." : "Resend email"}
      </Button>
    </div>
  );
}
