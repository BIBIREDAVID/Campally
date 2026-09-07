import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Megaphone, BookOpen, User, LogOut, Users, Tag } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";

const links = [
  { href: "/clubs", label: "Clubs & Societies", description: "Discover and follow recognised clubs", icon: Users },
  { href: "/deals", label: "Student Deals", description: "Discounts and benefits near campus", icon: Tag },
  { href: "/news", label: "News", description: "Student Union announcements and updates", icon: Megaphone },
  { href: "/campus", label: "Campus Information", description: "Handbook, contacts, and FAQs", icon: BookOpen },
  { href: "/profile", label: "Profile", description: "Your details and account", icon: User },
];

export default async function MorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-bold">More</h1>

      <Card className="flex flex-col divide-y divide-border overflow-hidden p-0">
        {links.map((link) => {
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

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm font-semibold text-destructive shadow-sm hover:bg-destructive/5"
        >
          <LogOut size={17} />
          Log out
        </button>
      </form>
    </div>
  );
}
