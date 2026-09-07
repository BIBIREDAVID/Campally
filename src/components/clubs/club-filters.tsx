"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLUB_CATEGORIES, CLUB_CATEGORY_LABELS } from "@/types/domain";

interface Props {
  activeCategory?: string;
  initialQuery?: string;
}

export function ClubFilters({ activeCategory, initialQuery }: Props) {
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
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearch} className="relative min-w-48 flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clubs..." className="pl-9" />
      </form>

      <Select
        items={[
          { value: "all", label: "All categories" },
          ...CLUB_CATEGORIES.map((c) => ({ value: c, label: CLUB_CATEGORY_LABELS[c] })),
        ]}
        value={activeCategory ?? "all"}
        onValueChange={(v) => updateParam("category", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CLUB_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {CLUB_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
