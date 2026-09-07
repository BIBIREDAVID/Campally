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
import { LinkButton } from "@/components/ui/link-button";
import { Footer } from "@/components/shared/footer";
import { Logo } from "@/components/shared/logo";
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
// under More so the bar never grows past what fits a thumb. Desktop's top
// nav has room to show everything flat — no "More" needed there.
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
    <div className="flex min-h-svh flex-col">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-20 hidden flex-col gap-3 border-b border-border bg-card/95 px-6 py-3.5 backdrop-blur md:flex">
        <div className="flex items-center justify-between gap-6">
          <Link href={isAdmin ? "/admin" : "/"} className="flex shrink-0 items-center gap-2.5 text-base font-extrabold tracking-tight">
            <Logo size={32} priority />
            Union
          </Link>

          <nav className="flex flex-1 flex-wrap items-center gap-1.5">
            {desktopNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    active && "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <Icon size={15} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/search"
              aria-label="Search"
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
                aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  pathname === "/notifications" && "bg-accent text-accent-foreground"
                )}
              >
                <Bell size={17} strokeWidth={2} />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--status-urgent)]" aria-hidden="true" />
                )}
              </Link>
            )}

            <div className="mx-1 h-5 w-px bg-border" />

            {isAuthenticated ? (
              <>
                <span className="text-xs font-medium text-muted-foreground">{displayName}</span>
                <button
                  onClick={handleLogout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                  aria-label="Log out"
                >
                  <LogOut size={16} strokeWidth={2} />
                </button>
              </>
            ) : (
              <>
                <LinkButton href="/login" variant="outline" size="sm">
                  Log in
                </LinkButton>
                <LinkButton href="/signup" size="sm">
                  Sign up
                </LinkButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2 text-sm font-extrabold">
          <Logo size={28} />
          Union
        </div>
        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">{displayName}</span>
              <Link href="/search" aria-label="Search" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground">
                <Search size={17} strokeWidth={2} />
              </Link>
              <Link
                href="/notifications"
                aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
                className="relative flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground"
              >
                <Bell size={18} strokeWidth={2} />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--status-urgent)]" aria-hidden="true" />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link href="/search" aria-label="Search" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground">
                <Search size={17} strokeWidth={2} />
              </Link>
              <Link href="/login" className="flex items-center gap-1 text-xs font-semibold text-primary">
                <LogIn size={14} /> Log in
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</div>
        {!isAdmin && <Footer />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-card md:hidden">
        {mobileNav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
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
