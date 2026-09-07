import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const exploreLinks = [
  { href: "/events", label: "Events" },
  { href: "/clubs", label: "Clubs & Societies" },
  { href: "/deals", label: "Student Deals" },
  { href: "/news", label: "News" },
];

const unionLinks = [
  { href: "/campus", label: "Campus Information" },
  { href: "/cases/new", label: "Submit a Case" },
  { href: "/search", label: "Search" },
];

// The Parliamentary Council is a separate LASUSU arm with its own site —
// linked externally rather than folded into this app.
const externalLinks = [{ href: "https://lasususpc.vercel.app", label: "Parliamentary Council" }];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-24 pt-8 sm:px-6 md:pb-10 md:pt-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-2">
            <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
              <Logo size={28} />
              Union
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              The LASU Students&apos; Union, in your pocket &mdash; cases, events, clubs, news, and deals in one place.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Explore</p>
            {exploreLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Student Union</p>
            {unionLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                {link.label}
              </Link>
            ))}
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Lagos State University Students&apos; Union.</p>
          <p>For official matters, contact your Student Union representative directly.</p>
        </div>
      </div>
    </footer>
  );
}
