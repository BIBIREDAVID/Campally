"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestClubMembershipAction, withdrawClubMembershipAction } from "@/lib/actions/clubs";
import type { ClubMembershipMode, ClubMembershipStatus } from "@/types/domain";

interface Props {
  clubId: string;
  membershipMode: ClubMembershipMode;
  initialStatus: ClubMembershipStatus | null;
}

export function MembershipButton({ clubId, membershipMode, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setSubmitting(true);
    setError(null);
    const result = await requestClubMembershipAction(clubId);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus(result.autoApproved ? "approved" : "pending");
    router.refresh();
  }

  async function handleWithdraw() {
    setSubmitting(true);
    setError(null);
    const result = await withdrawClubMembershipAction(clubId);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus(null);
    router.refresh();
  }

  if (status === "approved") {
    return <Button variant="outline" disabled>Member</Button>;
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-1.5">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button variant="outline" onClick={handleWithdraw} disabled={submitting}>
          {submitting ? "Withdrawing..." : "Request pending — withdraw"}
        </Button>
      </div>
    );
  }

  if (status === "rejected") {
    return <Button variant="outline" disabled>Membership request declined</Button>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button onClick={handleJoin} disabled={submitting}>
        {submitting ? "Sending..." : membershipMode === "open" ? "Join club" : "Request to join"}
      </Button>
    </div>
  );
}
