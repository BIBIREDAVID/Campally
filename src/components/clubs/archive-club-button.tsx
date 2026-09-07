"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveClubAction } from "@/lib/actions/clubs";

export function ArchiveClubButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleArchive() {
    setSubmitting(true);
    await archiveClubAction(id);
    setSubmitting(false);
    router.push("/admin/clubs");
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" size="sm" onClick={handleArchive} disabled={submitting}>
      <Archive size={13} className="mr-1.5" />
      {submitting ? "Archiving..." : "Archive club"}
    </Button>
  );
}
