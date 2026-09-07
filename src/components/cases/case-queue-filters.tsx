"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CASE_STATUS_LABELS, type CasePriority, type CaseStatus } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  statuses: CaseStatus[];
  priorities: CasePriority[];
  activeStatus?: string;
  activePriority?: string;
  activeOverdue?: boolean;
}

export function CaseQueueFilters({ statuses, priorities, activeStatus, activePriority, activeOverdue }: Props) {
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
    <div className="flex gap-2">
      <Select value={activeStatus ?? "all"} onValueChange={(v) => updateParam("status", v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {CASE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={activePriority ?? "all"} onValueChange={(v) => updateParam("priority", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {priorities.map((p) => (
            <SelectItem key={p} value={p} className="capitalize">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={activeOverdue ? "default" : "outline"}
        size="sm"
        onClick={() => updateParam("overdue", activeOverdue ? null : "true")}
      >
        Overdue only
      </Button>
    </div>
  );
}
