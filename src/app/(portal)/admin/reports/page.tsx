import { redirect } from "next/navigation";
import { Clock, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import {
  getCasesByCategory,
  getCronJobStatus,
  getFeedbackSummary,
  getResolutionStats,
  getTopClubsByFollowers,
  getTopDealsByEngagement,
  getTopEventsByRsvp,
} from "@/lib/queries/reports";
import { Card } from "@/components/ui/card";

const CRON_JOB_LABELS: Record<string, string> = {
  "union-event-reminders": "Event reminders",
  "union-deal-expiry-reminders": "Deal expiry reminders",
};

function CronStatusIcon({ status }: { status: string | null }) {
  if (status === "succeeded") return <CheckCircle2 size={15} className="text-[var(--status-open)]" />;
  if (status === "failed") return <XCircle size={15} className="text-destructive" />;
  return <MinusCircle size={15} className="text-muted-foreground" />;
}

function RankedList({ items, unit }: { items: { id: string; label: string; metric: number }[]; unit: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  const max = Math.max(...items.map((i) => i.metric));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm font-medium" title={item.label}>
            {item.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.metric / max) * 100}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
            {item.metric} {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "reports.view")) redirect("/");

  const [categories, resolution, feedback, topEvents, topClubs, topDeals, cronJobs] = await Promise.all([
    getCasesByCategory(),
    getResolutionStats(),
    getFeedbackSummary(),
    getTopEventsByRsvp(),
    getTopClubsByFollowers(),
    getTopDealsByEngagement(),
    getCronJobStatus(),
  ]);

  const totalCases = categories.reduce((sum, c) => sum + c.count, 0);
  const medianDays = resolution.medianHours != null ? (resolution.medianHours / 24).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Reports</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Median time to resolve</p>
          <p className="mt-1 text-3xl font-bold">{medianDays ?? "—"}{medianDays && <span className="text-base font-medium text-muted-foreground"> days</span>}</p>
          <p className="mt-1 text-xs text-muted-foreground">{resolution.resolvedCount} resolved case{resolution.resolvedCount === 1 ? "" : "s"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student satisfaction</p>
          <p className="mt-1 text-3xl font-bold">{feedback.average != null ? feedback.average.toFixed(1) : "—"}{feedback.average != null && <span className="text-base font-medium text-muted-foreground"> / 5</span>}</p>
          <p className="mt-1 text-xs text-muted-foreground">{feedback.count} rating{feedback.count === 1 ? "" : "s"} submitted</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cases logged</p>
          <p className="mt-1 text-3xl font-bold">{totalCases}</p>
          <p className="mt-1 text-xs text-muted-foreground">across {categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">Most common case categories</h2>
        <RankedList items={categories.map((c) => ({ id: c.name, label: c.name, metric: c.count }))} unit="cases" />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Most RSVP&apos;d events</h2>
          <RankedList items={topEvents} unit="RSVPs" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Most followed clubs</h2>
          <RankedList items={topClubs} unit="followers" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-muted-foreground">Most engaged-with deals</h2>
          <RankedList items={topDeals.map((d) => ({ id: d.id, label: d.label, metric: d.views + d.saves }))} unit="views+saves" />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
          <Clock size={14} /> Scheduled jobs
        </h2>
        {cronJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scheduled jobs found — pg_cron may not be enabled on this project.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {cronJobs.map((j) => (
              <li key={j.job_name} className="flex items-center gap-3 text-sm">
                <CronStatusIcon status={j.last_status} />
                <span className="w-44 shrink-0 font-medium">{CRON_JOB_LABELS[j.job_name] ?? j.job_name}</span>
                <span className="flex-1 text-xs text-muted-foreground">
                  {j.last_run_at
                    ? `Last ran ${new Date(j.last_run_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
                    : "Hasn't run yet"}
                </span>
                {!j.active && (
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                    Disabled
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
