"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decideClubMembershipAction } from "@/lib/actions/clubs";
import type { ClubMembership } from "@/types/domain";

export function MembershipRequestsPanel({ clubId, requests }: { clubId: string; requests: ClubMembership[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(membershipId: string, approve: boolean) {
    setBusyId(membershipId);
    await decideClubMembershipAction(membershipId, clubId, approve);
    setBusyId(null);
    router.refresh();
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending membership requests.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {requests.map((r) => (
        <li key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm">
            {r.users?.first_name} {r.users?.last_name}
            <span className="ml-1.5 text-xs text-muted-foreground">{r.users?.school_email}</span>
          </span>
          <div className="flex gap-1.5">
            <Button size="icon-sm" variant="outline" disabled={busyId === r.id} onClick={() => decide(r.id, true)}>
              <Check size={13} />
            </Button>
            <Button size="icon-sm" variant="destructive" disabled={busyId === r.id} onClick={() => decide(r.id, false)}>
              <X size={13} />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
