import { ANNOUNCEMENT_STATUS_LABELS, type AnnouncementPriority, type AnnouncementStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AnnouncementStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-[color-mix(in_oklch,var(--status-in-progress)_12%,transparent)] text-[var(--status-in-progress)]",
  published: "bg-[color-mix(in_oklch,var(--status-resolved)_12%,transparent)] text-[var(--status-resolved)]",
  archived: "bg-muted text-muted-foreground",
};

export function AnnouncementStatusBadge({ status }: { status: AnnouncementStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        STATUS_STYLES[status]
      )}
    >
      {ANNOUNCEMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function UrgentBadge({ priority }: { priority: AnnouncementPriority }) {
  if (priority !== "urgent") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--status-urgent)_12%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--status-urgent)]">
      Urgent
    </span>
  );
}
