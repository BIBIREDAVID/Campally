"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PillOption {
  value: string;
  label: string;
}

interface Props {
  paramKey: string;
  options: PillOption[];
  activeValue: string;
  /** When true, selecting the first option removes the param instead of setting it (an "All" pill). */
  firstIsDefault?: boolean;
}

// Shared across News, Events, and Campus Info so the three modules read as
// one system instead of three slightly different filter UIs.
export function PillTabs({ paramKey, options, activeValue, firstIsDefault }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (firstIsDefault && value === options[0]?.value) params.delete(paramKey);
    else params.set(paramKey, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5 overflow-x-auto">
      {options.map((option) => {
        const active = activeValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => select(option.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
