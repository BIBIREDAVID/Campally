import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries/current-user";
import { listPublishedAnnouncements } from "@/lib/queries/news";
import { PillTabs } from "@/components/shared/pill-tabs";
import { ContentCard } from "@/components/shared/content-card";
import { FeaturedCard } from "@/components/shared/featured-card";
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_CATEGORY_LABELS, type AnnouncementCategory } from "@/types/domain";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { category } = await searchParams;
  const { data: announcements } = await listPublishedAnnouncements(
    undefined,
    category as AnnouncementCategory | undefined
  );

  const [featured, ...rest] = announcements;

  const tabOptions = [
    { value: "all", label: "All" },
    ...ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: ANNOUNCEMENT_CATEGORY_LABELS[c] })),
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-xl font-bold">News</h1>

      {featured && (
        <FeaturedCard
          href={`/news/${featured.id}`}
          title={featured.title}
          description={featured.body}
          imageUrl={featured.cover_image_url}
          eyebrow={ANNOUNCEMENT_CATEGORY_LABELS[featured.category]}
          tags={featured.priority === "urgent" ? [{ label: "Urgent", variant: "urgent" }] : undefined}
        />
      )}

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold">Latest news</h2>
          <p className="text-sm text-muted-foreground">
            Student Union announcements and campus updates.
          </p>
        </div>
        <PillTabs paramKey="category" options={tabOptions} activeValue={category ?? "all"} firstIsDefault />
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-14 text-center text-muted-foreground shadow-sm">
          <p className="text-base font-bold text-foreground">Nothing new right now</p>
          <p className="mt-1 text-sm">Check back soon, or try a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(featured ? rest : announcements).map((a) => (
            <ContentCard
              key={a.id}
              href={`/news/${a.id}`}
              title={a.title}
              description={a.body}
              imageUrl={a.cover_image_url}
              tags={[
                { label: ANNOUNCEMENT_CATEGORY_LABELS[a.category] },
                ...(a.priority === "urgent" ? [{ label: "Urgent", variant: "urgent" as const }] : []),
              ]}
              meta={
                a.published_at
                  ? new Date(a.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
