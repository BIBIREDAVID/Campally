"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { closePollAction } from "@/lib/actions/polls";

export function ClosePollButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClose() {
    setSubmitting(true);
    await closePollAction(id);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleClose} disabled={submitting}>
      <Ban size={13} className="mr-1.5" />
      {submitting ? "Closing..." : "Close poll"}
    </Button>
  );
}
