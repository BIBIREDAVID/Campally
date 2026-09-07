import { Vote } from "lucide-react";
import { listPublishedPolls } from "@/lib/queries/polls";
import { ContentCard } from "@/components/shared/content-card";
import { EmptyState } from "@/components/shared/empty-state";

export default async function PollsPage() {
  const { data: polls } = await listPublishedPolls();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Polls</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quick sentiment checks from the Student Union.</p>
      </div>

      {polls.length === 0 ? (
        <EmptyState icon={Vote} title="No open polls" description="Check back when the Union asks something." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((p) => (
            <ContentCard
              key={p.id}
              href={`/polls/${p.id}`}
              title={p.question}
              description={p.description ?? undefined}
              fallbackIcon={Vote}
              official
              tags={[{ label: `${p.poll_options?.length ?? 0} options` }]}
              meta={p.closes_at ? `Closes ${new Date(p.closes_at).toLocaleDateString(undefined, { dateStyle: "medium" })}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
