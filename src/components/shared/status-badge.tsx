import { CASE_STATUS_LABELS, type CasePriority, type CaseStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CaseStatus, string> = {
  submitted: "bg-[color-mix(in_oklch,var(--status-open)_12%,transparent)] text-[var(--status-open)]",
  acknowledged: "bg-[color-mix(in_oklch,var(--status-in-progress)_12%,transparent)] text-[var(--status-in-progress)]",
  assigned: "bg-[color-mix(in_oklch,var(--status-in-progress)_12%,transparent)] text-[var(--status-in-progress)]",
  in_progress: "bg-[color-mix(in_oklch,var(--status-in-progress)_12%,transparent)] text-[var(--status-in-progress)]",
  awaiting_university: "bg-[color-mix(in_oklch,var(--status-in-progress)_12%,transparent)] text-[var(--status-in-progress)]",
  awaiting_student: "bg-[color-mix(in_oklch,var(--status-in-progress)_12%,transparent)] text-[var(--status-in-progress)]",
  resolved: "bg-[color-mix(in_oklch,var(--status-resolved)_12%,transparent)] text-[var(--status-resolved)]",
  closed: "bg-[color-mix(in_oklch,var(--status-resolved)_12%,transparent)] text-[var(--status-resolved)]",
  rejected: "bg-[color-mix(in_oklch,var(--status-open)_12%,transparent)] text-[var(--status-open)]",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        STATUS_STYLES[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {CASE_STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_STYLES: Record<CasePriority, string> = {
  low: "text-muted-foreground",
  normal: "text-muted-foreground",
  high: "text-[var(--status-in-progress)]",
  urgent: "text-[var(--status-urgent)]",
};

export function PriorityBadge({ priority }: { priority: CasePriority }) {
  return (
    <span className={cn("text-[11px] font-bold uppercase tracking-wide", PRIORITY_STYLES[priority])}>
      {priority}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--status-urgent)_12%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--status-urgent)]">
      Overdue
    </span>
  );
}
