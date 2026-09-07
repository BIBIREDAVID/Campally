import type { EventStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<EventStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-[color-mix(in_oklch,var(--status-resolved)_12%,transparent)] text-[var(--status-resolved)]",
  cancelled: "bg-[color-mix(in_oklch,var(--status-open)_12%,transparent)] text-[var(--status-open)]",
};

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function FullBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--status-urgent)_12%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--status-urgent)]">
      Full
    </span>
  );
}
