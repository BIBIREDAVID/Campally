"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { postClubAnnouncementAction } from "@/lib/actions/clubs";

export function ClubAnnouncementForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await postClubAnnouncementAction(clubId, title, body);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setTitle("");
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Input placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Message to followers and members" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
      <Button type="submit" size="sm" className="w-fit" disabled={submitting || !title.trim() || !body.trim()}>
        {submitting ? "Posting..." : "Post announcement"}
      </Button>
    </form>
  );
}
