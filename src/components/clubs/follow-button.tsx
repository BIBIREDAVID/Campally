"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { followClubAction, unfollowClubAction } from "@/lib/actions/clubs";

interface Props {
  clubId: string;
  initialFollowing: boolean;
}

export function FollowButton({ clubId, initialFollowing }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);

    const was = following;
    setFollowing(!was);

    const result = was ? await unfollowClubAction(clubId) : await followClubAction(clubId);
    setSubmitting(false);

    if (result.error) {
      setFollowing(was);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="button" variant={following ? "outline" : "default"} onClick={handleClick} disabled={submitting} className="gap-1.5">
        {following ? <Check size={15} /> : <Plus size={15} />}
        {following ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
