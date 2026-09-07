import { cn } from "@/lib/utils";
import type { PollStatus } from "@/types/domain";

const STYLES: Record<PollStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-[color-mix(in_oklch,var(--status-open)_14%,transparent)] text-[var(--status-open)]",
  closed: "bg-[color-mix(in_oklch,var(--status-urgent)_10%,transparent)] text-[var(--status-urgent)]",
};

const LABELS: Record<PollStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

export function PollStatusBadge({ status }: { status: PollStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", STYLES[status])}>
      {LABELS[status]}
    </span>
  );
}
