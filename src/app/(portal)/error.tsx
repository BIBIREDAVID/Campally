"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function PortalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-12">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description="We hit a snag loading this page. You can try again, or head back to Home."
        action={
          <Button onClick={retry} variant="default">
            Try again
          </Button>
        }
      />
    </div>
  );
}
