"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, WifiOff } from "lucide-react";
import { submitCaseAction } from "@/lib/actions/cases";
import { getQueuedCases, removeQueuedCase, type QueuedCase } from "@/lib/offline-case-queue";

// Mounted once, globally (see layout.tsx) — watches for queued offline case
// submissions and flushes them the moment connectivity returns, from
// wherever in the app the student happens to be.
export function OfflineQueueSync() {
  const router = useRouter();
  const [pending, setPending] = useState<QueuedCase[]>([]);
  const [justSynced, setJustSynced] = useState(false);
  const syncing = useRef(false);

  const refresh = useCallback(() => setPending(getQueuedCases()), []);

  const flush = useCallback(async () => {
    if (syncing.current || typeof navigator === "undefined" || !navigator.onLine) return;
    syncing.current = true;

    const queue = getQueuedCases();
    let syncedAny = false;
    for (const item of queue) {
      const result = await submitCaseAction({
        categoryId: item.categoryId,
        title: item.title,
        description: item.description,
        location: item.location,
        isAnonymous: item.isAnonymous,
      });
      if (!result.error) {
        removeQueuedCase(item.localId);
        syncedAny = true;
      }
    }

    syncing.current = false;
    refresh();
    if (syncedAny) {
      setJustSynced(true);
      router.refresh();
      setTimeout(() => setJustSynced(false), 4000);
    }
  }, [refresh, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refresh();
      flush();
    }, 0);
    window.addEventListener("union:offline-queue-changed", refresh);
    window.addEventListener("online", flush);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("union:offline-queue-changed", refresh);
      window.removeEventListener("online", flush);
    };
  }, [refresh, flush]);

  if (justSynced) {
    return (
      <div className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg md:bottom-4">
        <CheckCircle2 size={14} /> Queued case{pending.length === 1 ? "" : "s"} submitted
      </div>
    );
  }

  if (pending.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-lg ring-1 ring-border md:bottom-4">
      <WifiOff size={14} className="text-muted-foreground" />
      {pending.length} case{pending.length === 1 ? "" : "s"} queued — will send when back online
    </div>
  );
}
