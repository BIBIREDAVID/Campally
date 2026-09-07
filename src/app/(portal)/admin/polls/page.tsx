import { redirect } from "next/navigation";
import { Plus, Vote } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listPollsAdmin } from "@/lib/queries/polls";
import { PollStatusBadge } from "@/components/polls/poll-badges";
import { AdminContentCard } from "@/components/admin/admin-content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";

export default async function AdminPollsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "polls.manage")) redirect("/");

  const { data: polls } = await listPollsAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Polls</h1>
        <LinkButton href="/admin/polls/new" className="gap-2">
          <Plus size={16} /> New poll
        </LinkButton>
      </div>

      {polls.length === 0 ? (
        <EmptyState icon={Vote} title="No polls yet" description="Ask students a quick question." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((p) => (
            <AdminContentCard
              key={p.id}
              href={`/admin/polls/${p.id}`}
              title={p.question}
              fallbackIcon={Vote}
              meta={`${p.poll_options?.length ?? 0} options${p.closes_at ? ` · Closes ${new Date(p.closes_at).toLocaleDateString(undefined, { dateStyle: "medium" })}` : ""}`}
              statusBadge={<PollStatusBadge status={p.status} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
