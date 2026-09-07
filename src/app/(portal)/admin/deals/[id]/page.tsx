import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getDealForEdit } from "@/lib/queries/deals";
import { DealForm } from "@/components/deals/deal-form";
import { ArchiveDealButton } from "@/components/deals/archive-deal-button";
import { DealStatusBadge } from "@/components/deals/deal-badges";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "deals.manage")) redirect("/");

  const { data: deal } = await getDealForEdit(id);
  if (!deal) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/deals" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to deals
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Edit deal</h1>
          <DealStatusBadge status={deal.status} />
        </div>
        {deal.status !== "archived" && <ArchiveDealButton id={id} />}
      </div>

      <DealForm existing={deal} />
    </div>
  );
}
