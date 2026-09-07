import { Tag } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { listPublishedDeals } from "@/lib/queries/deals";
import { DealFilters } from "@/components/deals/deal-filters";
import { ContentCard } from "@/components/shared/content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DEAL_CATEGORY_LABELS, type DealCategory } from "@/types/domain";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; saved?: string }>;
}) {
  const user = await getCurrentUser();

  const { category, q, saved } = await searchParams;
  const savedOnly = saved === "saved";
  const { data: deals } = await listPublishedDeals(
    { category: category as DealCategory | undefined, q, savedOnly: user ? savedOnly : false },
    user?.profile.id
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-xl font-bold">Student Deals</h1>

      <DealFilters activeCategory={category} initialQuery={q} activeSaved={savedOnly ? "saved" : "all"} showSavedFilter={!!user} />

      {deals.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={savedOnly ? "No saved deals" : "No deals found"}
          description={savedOnly ? "Save deals to find them here." : "Check back soon."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((d) => (
            <ContentCard
              key={d.id}
              href={`/deals/${d.id}`}
              title={d.merchant_name}
              description={d.discount_summary}
              imageUrl={d.logo_url}
              fallbackIcon={Tag}
              tags={[{ label: DEAL_CATEGORY_LABELS[d.category] }]}
              meta={d.locations ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
