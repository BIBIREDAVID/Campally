import { listPublishedCampusContent } from "@/lib/queries/campus";
import { CampusSearch } from "@/components/campus/campus-search";
import { PillTabs } from "@/components/shared/pill-tabs";
import { ContentCard } from "@/components/shared/content-card";
import { CAMPUS_CATEGORIES, CAMPUS_CATEGORY_LABELS, type CampusContentCategory } from "@/types/domain";

export default async function CampusPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const { data: articles } = await listPublishedCampusContent(q, category as CampusContentCategory | undefined);

  const tabOptions = [
    { value: "all", label: "All" },
    ...CAMPUS_CATEGORIES.map((c) => ({ value: c, label: CAMPUS_CATEGORY_LABELS[c].split(" (")[0] })),
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <h1 className="text-xl font-bold">Campus Information</h1>
      <CampusSearch initialValue={q} />
      <PillTabs paramKey="category" options={tabOptions} activeValue={category ?? "all"} firstIsDefault />

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          {q ? (
            <>
              <p className="text-base font-bold text-foreground">No results for &quot;{q}&quot;</p>
              <p className="mt-1 text-sm">Try a different category, or contact the Student Union.</p>
            </>
          ) : (
            <p className="text-base font-bold text-foreground">Nothing here yet</p>
          )}
        </div>
      ) : category ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ContentCard key={a.id} href={`/campus/${a.id}`} title={a.title} description={a.body} />
          ))}
        </div>
      ) : (
        CAMPUS_CATEGORIES.map((cat) => {
          const items = articles.filter((a) => a.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {CAMPUS_CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => (
                  <ContentCard key={a.id} href={`/campus/${a.id}`} title={a.title} description={a.body} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
