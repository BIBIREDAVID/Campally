import { redirect } from "next/navigation";
import Link from "next/link";
import { Megaphone, CalendarDays, Users, BookOpen, Tag } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { globalSearch, type SearchResult } from "@/lib/queries/search";
import { SearchBar } from "@/components/shared/search-bar";

const KIND_META: Record<SearchResult["kind"], { label: string; icon: typeof Megaphone }> = {
  news: { label: "News", icon: Megaphone },
  event: { label: "Event", icon: CalendarDays },
  club: { label: "Club", icon: Users },
  campus: { label: "Campus Info", icon: BookOpen },
  deal: { label: "Deal", icon: Tag },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;
  const { data: results } = q ? await globalSearch(q, user.profile.tenant_id) : { data: [] };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-xl font-bold">Search</h1>
      <SearchBar initialQuery={q} />

      {!q ? (
        <p className="text-sm text-muted-foreground">
          Search news, events, clubs, campus information, and deals all at once.
        </p>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">No results for &ldquo;{q}&rdquo;</p>
          <p className="mt-1 text-sm">Try different words, or check your spelling.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((r) => {
            const meta = KIND_META[r.kind];
            const Icon = meta.icon;
            return (
              <Link
                key={`${r.kind}-${r.id}`}
                href={r.url}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 hover:border-primary"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon size={15} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{meta.label}</p>
                  <p className="text-sm font-semibold leading-snug">{r.title}</p>
                  {r.snippet && <p className="mt-0.5 text-xs text-muted-foreground">{r.snippet}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
