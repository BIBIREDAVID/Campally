"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#f7f8fa] p-6 text-center font-sans">
        <h1 className="text-lg font-bold text-[#111827]">Something went wrong</h1>
        <p className="max-w-xs text-sm text-[#6b7280]">
          Union hit an unexpected error. Please try again.
        </p>
        <button
          onClick={retry}
          className="rounded-lg bg-[#3b6ef6] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
