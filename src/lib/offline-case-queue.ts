// A small localStorage-backed queue for case submissions made while
// offline. Deliberately client-only and explicit about state — a queued
// submission is shown as "queued", never as "submitted", per the same
// no-false-success rule documented in public/sw.js. Synced automatically
// when the browser regains connectivity (see offline-queue-sync.tsx).

export interface QueuedCase {
  localId: string;
  categoryId: string;
  title: string;
  description: string;
  location?: string;
  isAnonymous: boolean;
  queuedAt: string;
}

const STORAGE_KEY = "union.offline_case_queue";

function safeParse(raw: string | null): QueuedCase[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getQueuedCases(): QueuedCase[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function enqueueCase(input: Omit<QueuedCase, "localId" | "queuedAt">): QueuedCase {
  const entry: QueuedCase = {
    ...input,
    localId: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
  };
  const queue = getQueuedCases();
  queue.push(entry);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event("union:offline-queue-changed"));
  return entry;
}

export function removeQueuedCase(localId: string) {
  const queue = getQueuedCases().filter((c) => c.localId !== localId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event("union:offline-queue-changed"));
}
