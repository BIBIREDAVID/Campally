import { redirect } from "next/navigation";
import { Plus, Tag } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listDealsAdmin } from "@/lib/queries/deals";
import { DealStatusBadge } from "@/components/deals/deal-badges";
import { AdminContentCard } from "@/components/admin/admin-content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { DEAL_CATEGORY_LABELS } from "@/types/domain";

export default async function AdminDealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "deals.manage")) redirect("/");

  const { data: deals } = await listDealsAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Deals</h1>
        <LinkButton href="/admin/deals/new" className="gap-2">
          <Plus size={16} /> New deal
        </LinkButton>
      </div>

      {deals.length === 0 ? (
        <EmptyState icon={Tag} title="No deals yet" description="Add the first student discount or benefit." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((d) => (
            <AdminContentCard
              key={d.id}
              href={`/admin/deals/${d.id}`}
              title={d.merchant_name}
              imageUrl={d.logo_url}
              fallbackIcon={Tag}
              category={DEAL_CATEGORY_LABELS[d.category]}
              meta={`${d.discount_summary}${d.expires_at ? ` · Expires ${new Date(d.expires_at).toLocaleDateString(undefined, { dateStyle: "medium" })}` : ""}`}
              statusBadge={<DealStatusBadge status={d.status} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
