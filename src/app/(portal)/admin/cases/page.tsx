import { redirect } from "next/navigation";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { isOverdue, listCaseQueue } from "@/lib/queries/cases";
import { StatusBadge, PriorityBadge, OverdueBadge } from "@/components/shared/status-badge";
import { CaseQueueFilters } from "@/components/cases/case-queue-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { CASE_PRIORITIES, CASE_STATUSES } from "@/types/domain";

export default async function AdminCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; overdue?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "cases.manage")) redirect("/");

  const { status, priority, overdue } = await searchParams;
  const { data: cases } = await listCaseQueue({ status, priority, overdueOnly: overdue === "true" }, user);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Cases</h1>
        <CaseQueueFilters
          statuses={CASE_STATUSES}
          priorities={CASE_PRIORITIES}
          activeStatus={status}
          activePriority={priority}
          activeOverdue={overdue === "true"}
        />
      </div>

      {cases.length === 0 ? (
        <EmptyState icon={PartyPopper} title="No cases match this filter" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/cases/${c.id}`} className="font-medium hover:text-primary">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.users ? `${c.users.first_name} ${c.users.last_name}` : "Anonymous"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.case_categories?.name}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      {isOverdue(c) && <OverdueBadge />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
