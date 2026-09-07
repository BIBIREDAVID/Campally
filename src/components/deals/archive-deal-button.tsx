"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveDealAction } from "@/lib/actions/deals";

export function ArchiveDealButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleArchive() {
    setSubmitting(true);
    await archiveDealAction(id);
    setSubmitting(false);
    router.push("/admin/deals");
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleArchive} disabled={submitting}>
      <Archive size={13} className="mr-1.5" />
      {submitting ? "Archiving..." : "Archive deal"}
    </Button>
  );
}
