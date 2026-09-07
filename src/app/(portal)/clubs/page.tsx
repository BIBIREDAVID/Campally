import { getCurrentUser } from "@/lib/queries/current-user";
import { listPublishedClubs } from "@/lib/queries/clubs";
import { ClubFilters } from "@/components/clubs/club-filters";
import { ContentCard } from "@/components/shared/content-card";
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
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">No clubs found</p>
          <p className="mt-1 text-sm">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c) => (
            <ContentCard
              key={c.id}
              href={`/clubs/${c.id}`}
              title={c.name}
              description={c.description}
              imageUrl={c.cover_image_url ?? c.logo_url}
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
