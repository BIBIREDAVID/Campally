"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrackCaseForm({ initialReference }: { initialReference?: string }) {
  const router = useRouter();
  const [reference, setReference] = useState(initialReference ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return;
    router.push(`/track?ref=${encodeURIComponent(reference.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="reference">Reference number</Label>
        <Input
          id="reference"
          placeholder="CASE-2026-AB12CD"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      <Button type="submit">Track</Button>
    </form>
  );
}
