import { Search, Clock } from "lucide-react";
import { trackCaseByReference } from "@/lib/queries/cases";
import { TrackCaseForm } from "@/components/cases/track-case-form";
import { CASE_STATUS_LABELS, type CaseStatus } from "@/types/domain";

export default async function TrackCasePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const result = ref ? await trackCaseByReference(ref) : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Track a Case</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Look up a case by its reference number — no account needed. Useful if you submitted
          anonymously or don&apos;t want to sign in just to check progress.
        </p>
      </div>

      <TrackCaseForm initialReference={ref} />

      {result?.rateLimited && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Too many lookups</p>
          <p className="text-xs text-muted-foreground">Wait a minute and try again.</p>
        </div>
      )}

      {ref && !result?.data && !result?.rateLimited && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-8 text-center">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No case found for &ldquo;{ref}&rdquo;</p>
          <p className="text-xs text-muted-foreground">
            Double-check the reference number — it looks like CASE-2026-AB12CD.
          </p>
        </div>
      )}

      {result?.data && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground">{result.data.reference_number}</p>
              <h2 className="text-lg font-bold">{result.data.title}</h2>
              <p className="text-sm text-muted-foreground">{result.data.category_name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {CASE_STATUS_LABELS[result.data.status as CaseStatus] ?? result.data.status}
            </span>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
            <ol className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>
                  Submitted{" "}
                  <span className="text-muted-foreground">
                    {new Date(result.data.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </span>
              </li>
              {result.history.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>
                    Status changed to {CASE_STATUS_LABELS[h.new_value as CaseStatus] ?? h.new_value}{" "}
                    <span className="text-muted-foreground">
                      {new Date(h.changed_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
