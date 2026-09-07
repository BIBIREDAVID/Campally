"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveDealAction, unsaveDealAction } from "@/lib/actions/deals";

interface Props {
  dealId: string;
  initialSaved: boolean;
}

export function SaveDealButton({ dealId, initialSaved }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    const was = saved;
    setSaved(!was);

    const result = was ? await unsaveDealAction(dealId) : await saveDealAction(dealId);
    setSubmitting(false);

    if (result.error) {
      setSaved(was);
      return;
    }
    router.refresh();
  }

  return (
    <Button type="button" variant={saved ? "outline" : "default"} onClick={handleClick} disabled={submitting} className="gap-1.5">
      <Heart size={15} fill={saved ? "currentColor" : "none"} />
      {saved ? "Saved" : "Save deal"}
    </Button>
  );
}
