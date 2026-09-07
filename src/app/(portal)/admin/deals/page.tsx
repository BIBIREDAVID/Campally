import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listDealsAdmin } from "@/lib/queries/deals";
import { DealStatusBadge } from "@/components/deals/deal-badges";
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
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">No deals yet</p>
          <p className="mt-1 text-sm">Add the first student discount or benefit.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Merchant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/deals/${d.id}`} className="font-medium hover:text-primary">
                      {d.merchant_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{DEAL_CATEGORY_LABELS[d.category]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.discount_summary}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.expires_at ? new Date(d.expires_at).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <DealStatusBadge status={d.status} />
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
