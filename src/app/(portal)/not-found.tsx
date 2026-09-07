import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-12">
      <EmptyState
        icon={SearchX}
        title="Page not found"
        description="That page doesn't exist or may have moved."
        action={<LinkButton href="/">Back to Home</LinkButton>}
      />
    </div>
  );
}
