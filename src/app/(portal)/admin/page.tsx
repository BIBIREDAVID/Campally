import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getDashboardMetrics } from "@/lib/queries/admin";
import { Card } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "dashboard.view")) redirect("/");

  const metrics = await getDashboardMetrics();

  const cards = [
    { label: "Registered students", value: metrics.totalStudents, href: "/admin/students" },
    { label: "Open cases", value: metrics.openCases, href: "/admin/cases" },
    { label: "Resolved cases", value: metrics.resolvedCases, href: "/admin/cases?status=resolved" },
    {
      label: "Overdue cases",
      value: metrics.overdueCases,
      href: "/admin/cases?overdue=true",
      urgent: metrics.overdueCases > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block">
            <Card className="p-5 transition-colors hover:border-primary">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className={`mt-1 text-3xl font-bold ${c.urgent ? "text-[var(--status-urgent)]" : ""}`}>{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">Cases by status</h2>
        <ul className="flex flex-col gap-2">
          {Object.entries(metrics.statusCounts).map(([status, count]) => (
            <li key={status} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
              <span className="capitalize">{status.replace(/_/g, " ")}</span>
              <strong className="text-primary">{count}</strong>
            </li>
          ))}
          {Object.keys(metrics.statusCounts).length === 0 && (
            <p className="text-sm text-muted-foreground">No cases yet.</p>
          )}
        </ul>
      </Card>
    </div>
  );
}
