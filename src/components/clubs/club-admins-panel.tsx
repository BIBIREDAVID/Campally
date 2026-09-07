"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addClubAdminAction, removeClubAdminAction } from "@/lib/actions/clubs";
import type { ClubAdminRow } from "@/lib/queries/clubs";

export function ClubAdminsPanel({ clubId, admins }: { clubId: string; admins: ClubAdminRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await addClubAdminAction(clubId, email);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEmail("");
    router.refresh();
  }

  async function handleRemove(rowId: string) {
    setSubmitting(true);
    await removeClubAdminAction(rowId, clubId);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Club administrators can manage this club&apos;s profile, membership requests, and announcements &mdash; without access to any other club.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {admins.length === 0 ? (
        <p className="text-sm text-muted-foreground">No club administrators yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
              <span>
                {a.users.first_name} {a.users.last_name}
                <span className="ml-1.5 text-xs text-muted-foreground">{a.users.school_email}</span>
              </span>
              <button
                type="button"
                onClick={() => handleRemove(a.id)}
                disabled={submitting}
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${a.users.first_name} ${a.users.last_name}`}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          type="email"
          placeholder="Student's university email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={!email.trim() || submitting}>
          {submitting ? "Adding..." : "Add"}
        </Button>
      </form>
    </div>
  );
}
