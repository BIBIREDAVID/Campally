"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelEventAction } from "@/lib/actions/events";

export function CancelEventButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleCancel() {
    setSubmitting(true);
    await cancelEventAction(id);
    setSubmitting(false);
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleCancel} disabled={submitting}>
      <Ban size={13} className="mr-1.5" />
      {submitting ? "Cancelling..." : "Cancel event"}
    </Button>
  );
}
