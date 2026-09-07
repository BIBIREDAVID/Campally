"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PillTabs } from "@/components/shared/pill-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, type Faculty } from "@/types/domain";

const WHEN_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "upcoming", label: "Upcoming" },
];

interface Props {
  activeWhen: string;
  activeCategory?: string;
  activeFaculty?: string;
  faculties?: Faculty[];
}

export function EventFilters({ activeWhen, activeCategory, activeFaculty, faculties = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <PillTabs paramKey="when" options={WHEN_OPTIONS} activeValue={activeWhen} />

      <Select
        items={[
          { value: "all", label: "All categories" },
          ...EVENT_CATEGORIES.map((c) => ({ value: c, label: EVENT_CATEGORY_LABELS[c] })),
        ]}
        value={activeCategory ?? "all"}
        onValueChange={(v) => updateParam("category", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {EVENT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {EVENT_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {faculties.length > 0 && (
        <Select
          items={[{ value: "all", label: "All faculties" }, ...faculties.map((f) => ({ value: f.id, label: f.name }))]}
          value={activeFaculty ?? "all"}
          onValueChange={(v) => updateParam("faculty", v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All faculties</SelectItem>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
