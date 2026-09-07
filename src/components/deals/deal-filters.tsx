"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PillTabs } from "@/components/shared/pill-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_CATEGORIES, DEAL_CATEGORY_LABELS } from "@/types/domain";

const SAVED_OPTIONS = [
  { value: "all", label: "All deals" },
  { value: "saved", label: "Saved" },
];

interface Props {
  activeCategory?: string;
  initialQuery?: string;
  activeSaved: string;
  showSavedFilter?: boolean;
}

export function DealFilters({ activeCategory, initialQuery, activeSaved, showSavedFilter = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQuery ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", q.trim() || null);
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSearch} className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search deals..." className="pl-9" />
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {showSavedFilter ? (
          <PillTabs paramKey="saved" options={SAVED_OPTIONS} activeValue={activeSaved} firstIsDefault />
        ) : (
          <span />
        )}

        <Select
          items={[
            { value: "all", label: "All categories" },
            ...DEAL_CATEGORIES.map((c) => ({ value: c, label: DEAL_CATEGORY_LABELS[c] })),
          ]}
          value={activeCategory ?? "all"}
          onValueChange={(v) => updateParam("category", v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {DEAL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {DEAL_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
