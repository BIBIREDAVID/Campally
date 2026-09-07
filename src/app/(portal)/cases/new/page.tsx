import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/current-user";
import { listCaseCategories } from "@/lib/queries/cases";
import { SubmitCaseForm } from "@/components/cases/submit-case-form";

export default async function NewCasePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const categories = await listCaseCategories();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="text-xl font-bold">Submit a Case</h1>
      <SubmitCaseForm categories={categories} />
    </div>
  );
}
