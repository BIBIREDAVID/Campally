import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { listCampusContentAdmin } from "@/lib/queries/campus";
import { CampusStatusBadge } from "@/components/campus/campus-status-badge";
import { LinkButton } from "@/components/ui/link-button";
import { CAMPUS_CATEGORY_LABELS } from "@/types/domain";

export default async function AdminCampusPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "campus.manage")) redirect("/");

  const { data: articles } = await listCampusContentAdmin();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Campus Information</h1>
        <LinkButton href="/admin/campus/new" className="gap-2">
          <Plus size={16} /> New article
        </LinkButton>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">No campus content yet</p>
          <p className="mt-1 text-sm">Add your first handbook article for students.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/campus/${a.id}`} className="font-medium hover:text-primary">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{CAMPUS_CATEGORY_LABELS[a.category]}</td>
                  <td className="px-4 py-3">
                    <CampusStatusBadge status={a.status} />
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
