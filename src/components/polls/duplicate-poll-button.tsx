"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicatePollAction } from "@/lib/actions/polls";

export function DuplicatePollButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleDuplicate() {
    setSubmitting(true);
    const result = await duplicatePollAction(id);
    setSubmitting(false);
    if (result.id) router.push(`/admin/polls/${result.id}`);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleDuplicate} disabled={submitting}>
      <Copy size={13} className="mr-1.5" />
      {submitting ? "Duplicating..." : "Duplicate"}
    </Button>
  );
}
