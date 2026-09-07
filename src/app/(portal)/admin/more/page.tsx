import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Users, Tag, Megaphone, Vote, BookOpen, GraduationCap, BarChart3, ShieldAlert, Settings } from "lucide-react";
import { getCurrentUser, hasPermission, isAdminUser } from "@/lib/queries/current-user";
import { Card } from "@/components/ui/card";

const links = [
  { href: "/admin/clubs", label: "Clubs", description: "Approve and manage clubs & societies", icon: Users, permission: "clubs.manage" },
  { href: "/admin/deals", label: "Deals", description: "Student deals and offers", icon: Tag, permission: "deals.manage" },
  { href: "/admin/news", label: "News", description: "Union announcements and updates", icon: Megaphone, permission: "news.manage" },
  { href: "/admin/polls", label: "Polls", description: "Create and manage polls", icon: Vote, permission: "polls.manage" },
  { href: "/admin/campus", label: "Campus", description: "Handbook, contacts, and FAQs", icon: BookOpen, permission: "campus.manage" },
  { href: "/admin/students", label: "Students", description: "Registered student directory", icon: GraduationCap, permission: "students.view" },
  { href: "/admin/reports", label: "Reports", description: "Union activity and case reports", icon: BarChart3, permission: "reports.view" },
  { href: "/admin/audit", label: "Audit Log", description: "Admin action history", icon: ShieldAlert, permission: "audit.view" },
  { href: "/admin/settings", label: "Settings", description: "Tenant branding and roles", icon: Settings, permission: "tenant.manage" },
];

export default async function AdminMorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminUser(user)) redirect("/");

  const visibleLinks = links.filter((link) => hasPermission(user, link.permission));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-bold">More</h1>

      <Card className="flex flex-col divide-y divide-border overflow-hidden p-0">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-4 hover:bg-muted/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon size={17} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{link.label}</span>
                <span className="block text-xs text-muted-foreground">{link.description}</span>
              </span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
