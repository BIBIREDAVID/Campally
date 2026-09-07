"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Home,
  LogOut,
  LogIn,
  LayoutDashboard,
  Megaphone,
  BookOpen,
  MoreHorizontal,
  User,
  CalendarDays,
  Users,
  Tag,
  Bell,
  GraduationCap,
  Search,
  BarChart3,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isAdmin: boolean;
  displayName: string;
  unreadNotifications: number;
}

// Student mobile bottom nav is deliberately capped at Home/Cases/More (see
// Phase 2 IA decision): Cases earns a permanent slot on stakes, not
// frequency, while lower-frequency content (News, Campus, Profile) lives
// under More so the bar never grows past what fits a thumb. Desktop has
// room, so its sidebar shows everything flat — no "More" needed there.
const studentPrimaryNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cases", label: "Cases", icon: ClipboardList },
  { href: "/events", label: "Events", icon: CalendarDays },
];

const studentSecondaryNav = [
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/news", label: "News", icon: Megaphone },
  { href: "/campus", label: "Campus", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

// A logged-out visitor gets the same content, minus anything tied to an
// account — Cases (private) and Profile don't exist for them, so they drop
// out of the nav entirely rather than linking somewhere that just bounces
// back to /login.
const publicPrimaryNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
];

const publicSecondaryNav = [
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/news", label: "News", icon: Megaphone },
  { href: "/campus", label: "Campus", icon: BookOpen },
];

const staffNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cases", label: "Cases", icon: ClipboardList },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/clubs", label: "Clubs", icon: Users },
  { href: "/admin/deals", label: "Deals", icon: Tag },
  { href: "/admin/news", label: "News", icon: Megaphone },
  { href: "/admin/campus", label: "Campus", icon: BookOpen },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function AppShell({ children, isAuthenticated, isAdmin, displayName, unreadNotifications }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const primaryNav = isAdmin ? staffNav : isAuthenticated ? studentPrimaryNav : publicPrimaryNav;
  const secondaryNav = isAdmin ? [] : isAuthenticated ? studentSecondaryNav : publicSecondaryNav;
  const desktopNav = [...primaryNav, ...secondaryNav];
  const mobileNav = isAdmin ? staffNav : primaryNav;
  const isInMore = !isAdmin && secondaryNav.some((item) => pathname === item.href);

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col gap-8 border-r border-border bg-card p-6 md:flex">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 text-base font-extrabold tracking-tight">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent-foreground shadow" />
            Union
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                pathname === "/search" && "bg-accent text-accent-foreground"
              )}
            >
              <Search size={16} strokeWidth={2} />
            </Link>
            {isAuthenticated && (
              <Link
                href="/notifications"
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  pathname === "/notifications" && "bg-accent text-accent-foreground"
                )}
              >
                <Bell size={17} strokeWidth={2} />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--status-urgent)]" />
                )}
              </Link>
            )}
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {desktopNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut size={17} strokeWidth={2} />
            Log out
          </button>
        ) : (
          <div className="mt-auto flex flex-col gap-2">
            <p className="px-1 text-xs text-muted-foreground">Sign up to submit cases, RSVP, and more.</p>
            <Button asChild size="sm" className="w-full">
              <Link href="/signup">Sign up</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2 text-sm font-extrabold">
          <span className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent-foreground" />
          Union
        </div>
        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">{displayName}</span>
              <Link href="/search" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground">
                <Search size={17} strokeWidth={2} />
              </Link>
              <Link href="/notifications" className="relative flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground">
                <Bell size={18} strokeWidth={2} />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--status-urgent)]" />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link href="/search" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground">
                <Search size={17} strokeWidth={2} />
              </Link>
              <Link href="/login" className="flex items-center gap-1 text-xs font-semibold text-primary">
                <LogIn size={14} /> Log in
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-card md:hidden">
        {mobileNav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
                active && "text-primary"
              )}
            >
              <Icon size={20} strokeWidth={2} fill={active ? "currentColor" : "none"} />
              {item.label}
            </Link>
          );
        })}

        {!isAdmin && (
          <Link
            href="/more"
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
              (pathname === "/more" || isInMore) && "text-primary"
            )}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
            More
          </Link>
        )}
      </nav>
    </div>
  );
}
