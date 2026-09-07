import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listAuditLogs, listAuditActions } from "@/lib/queries/audit";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";

function describeChange(entry: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  if (!entry.before && !entry.after) return null;
  const keys = new Set([...Object.keys(entry.before ?? {}), ...Object.keys(entry.after ?? {})]);
  const changed = Array.from(keys).filter(
    (k) => JSON.stringify(entry.before?.[k]) !== JSON.stringify(entry.after?.[k])
  );
  if (changed.length === 0) return null;
  return changed
    .slice(0, 4)
    .map((k) => `${k}: ${JSON.stringify(entry.before?.[k]) ?? "—"} → ${JSON.stringify(entry.after?.[k]) ?? "—"}`)
    .join(" · ");
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "audit.view")) redirect("/");

  const { action, q } = await searchParams;
  const [{ data: logs }, actions] = await Promise.all([
    listAuditLogs({ action, q }),
    listAuditActions(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A record of sensitive admin actions — most recent 200 entries.
        </p>
      </div>

      <AuditLogFilters actions={actions} activeAction={action} initialQuery={q} />

      {logs.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No matching entries" description="Try a different filter or search term." />
      ) : (
        <Card className="flex flex-col divide-y divide-border overflow-hidden p-0">
          {logs.map((l) => {
            const change = describeChange(l);
            return (
              <div key={l.id} className="flex flex-col gap-1 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {l.action}
                    </span>
                    <span className="text-muted-foreground">
                      {l.entity_type}
                      {l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {l.users ? `${l.users.first_name} ${l.users.last_name}` : "System"}
                </p>
                {change && <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{change}</p>}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
