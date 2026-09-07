import Link from "next/link";
import { ChevronRight, Megaphone, BookOpen, User, LogOut, Users, Tag, LogIn, UserPlus, Vote, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/card";

const contentLinks = [
  { href: "/clubs", label: "Clubs & Societies", description: "Discover and follow recognised clubs", icon: Users },
  { href: "/deals", label: "Student Deals", description: "Discounts and benefits near campus", icon: Tag },
  { href: "/news", label: "News", description: "Student Union announcements and updates", icon: Megaphone },
  { href: "/polls", label: "Polls", description: "Have your say on what the Union asks", icon: Vote },
  { href: "/campus", label: "Campus Information", description: "Handbook, contacts, and FAQs", icon: BookOpen },
  { href: "/track", label: "Track a Case", description: "Check a case's status by reference number", icon: Search },
];

const profileLink = { href: "/profile", label: "Profile", description: "Your details and account", icon: User };

export default async function MorePage() {
  const user = await getCurrentUser();
  const links = user ? [...contentLinks, profileLink] : contentLinks;

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

      {user ? (
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm font-semibold text-destructive shadow-sm hover:bg-destructive/5"
          >
            <LogOut size={17} />
            Log out
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Sign up to submit cases, RSVP to events, follow clubs, and more.</p>
          <div className="flex gap-2">
            <Link href="/signup" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
              <UserPlus size={15} /> Sign up
            </Link>
            <Link href="/login" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-semibold">
              <LogIn size={15} /> Log in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
