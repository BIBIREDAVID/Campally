import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { listMyCases } from "@/lib/queries/cases";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";

export default async function CasesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile.user_type === "staff") redirect("/admin/cases");

  const { data: cases } = await listMyCases(user.profile.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cases</h1>
        <LinkButton href="/cases/new" size="sm" className="gap-2">
          <Plus size={16} /> New case
        </LinkButton>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No cases yet"
          description="Report an issue and the Union will follow up here."
          action={
            <LinkButton href="/cases/new" className="mt-1">
              Submit a Case
            </LinkButton>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cases/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{c.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.case_categories?.name} · {c.reference_number}
                  </span>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
