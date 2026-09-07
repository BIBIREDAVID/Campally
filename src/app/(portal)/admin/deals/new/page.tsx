import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { DealForm } from "@/components/deals/deal-form";

export default async function NewDealPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "deals.manage")) redirect("/");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/admin/deals" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to deals
      </Link>
      <h1 className="text-xl font-bold">New deal</h1>
      <DealForm />
    </div>
  );
}
