import { CAMPUS_STATUS_LABELS, type CampusContentStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CampusContentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-[color-mix(in_oklch,var(--status-resolved)_12%,transparent)] text-[var(--status-resolved)]",
  archived: "bg-muted text-muted-foreground",
};

export function CampusStatusBadge({ status }: { status: CampusContentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        STATUS_STYLES[status]
      )}
    >
      {CAMPUS_STATUS_LABELS[status]}
    </span>
  );
}
