import { CASE_STATUS_LABELS, type CaseComment, type CaseHistoryEntry, type CaseStatus } from "@/types/domain";

interface Props {
  history: CaseHistoryEntry[];
  comments: CaseComment[];
}

export function CaseTimeline({ history, comments }: Props) {
  const events = [
    ...history
      .filter((h) => h.field_changed === "status")
      .map((h) => ({
        type: "status" as const,
        at: h.created_at,
        label: `Status changed to ${CASE_STATUS_LABELS[h.new_value as CaseStatus] ?? h.new_value}`,
      })),
    ...comments.map((c) => ({
      type: "comment" as const,
      at: c.created_at,
      label: c.body,
      author: c.users ? `${c.users.first_name} ${c.users.last_name}` : "Student",
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3 border-l-2 border-border pl-4">
      {events.map((event, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
          {event.type === "status" ? (
            <p className="text-sm font-medium">{event.label}</p>
          ) : (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{event.author}</p>
              <p className="text-sm">{event.label}</p>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            {new Date(event.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </li>
      ))}
    </ul>
  );
}
