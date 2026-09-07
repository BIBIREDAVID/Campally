import { Users } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { listPublishedClubs } from "@/lib/queries/clubs";
import { ClubFilters } from "@/components/clubs/club-filters";
import { ContentCard } from "@/components/shared/content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { CLUB_CATEGORY_LABELS, type ClubCategory } from "@/types/domain";

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const user = await getCurrentUser();

  const { category, q } = await searchParams;
  const { data: clubs } = await listPublishedClubs(
    { category: category as ClubCategory | undefined, q },
    user?.profile.id
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-xl font-bold">Clubs & Societies</h1>

      <ClubFilters activeCategory={category} initialQuery={q} />

      {clubs.length === 0 ? (
        <EmptyState icon={Users} title="No clubs found" description="Try a different search or category." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <ContentCard
              key={c.id}
              href={`/clubs/${c.id}`}
              title={c.name}
              description={c.description}
              imageUrl={c.cover_image_url ?? c.logo_url}
              fallbackIcon={Users}
              tags={[
                { label: CLUB_CATEGORY_LABELS[c.category] },
                ...(c.viewer_follows ? [{ label: "Following" }] : []),
              ]}
              meta={`${c.follower_count ?? 0} follower${c.follower_count === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
