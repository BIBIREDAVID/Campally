import type { ClubStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ClubStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-[color-mix(in_oklch,var(--status-resolved)_12%,transparent)] text-[var(--status-resolved)]",
  archived: "bg-[color-mix(in_oklch,var(--status-open)_12%,transparent)] text-[var(--status-open)]",
};

const STATUS_LABELS: Record<ClubStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function ClubStatusBadge({ status }: { status: ClubStatus }) {
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
