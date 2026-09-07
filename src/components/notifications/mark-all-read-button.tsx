"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";

export function MarkAllReadButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    await markAllNotificationsReadAction();
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={submitting}>
      {submitting ? "Marking..." : "Mark all read"}
    </Button>
  );
}
