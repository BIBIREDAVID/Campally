"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCaseAction } from "@/lib/actions/cases";
import {
  CASE_PRIORITIES,
  CASE_STATUS_LABELS,
  CASE_STATUSES,
  ESCALATION_OFFICES,
  type CasePriority,
  type CaseStatus,
} from "@/types/domain";

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  caseId: string;
  status: CaseStatus;
  priority: CasePriority;
  assignedTo: string | null;
  escalatedToOffice: string | null;
  staff: Staff[];
}

export function AdminCaseControls({ caseId, status, priority, assignedTo, escalatedToOffice, staff }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(status);
  const [office, setOffice] = useState(escalatedToOffice ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(input: Parameters<typeof updateCaseAction>[1]) {
    setSaving(true);
    setError(null);
    const result = await updateCaseAction(caseId, input);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function handleStatusChange(v: string | null) {
    if (!v) return;
    const next = v as CaseStatus;
    setPendingStatus(next);
    if (next === "awaiting_university" && !escalatedToOffice && !office) {
      // Needs an office selected first — don't submit yet.
      return;
    }
    handleChange({ status: next, escalatedToOffice: office || undefined });
  }

  function handleOfficeChange(v: string | null) {
    if (!v) return;
    setOffice(v);
    if (pendingStatus === "awaiting_university") {
      handleChange({ status: "awaiting_university", escalatedToOffice: v });
    } else {
      handleChange({ escalatedToOffice: v });
    }
  }

  return (
    <Card className="flex h-fit flex-col gap-5 p-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label>Status</Label>
        <Select value={pendingStatus} onValueChange={handleStatusChange} disabled={saving}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CASE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {CASE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(pendingStatus === "awaiting_university" || escalatedToOffice) && (
        <div className="flex flex-col gap-1.5">
          <Label>Escalated to (university office)</Label>
          <Select
            items={ESCALATION_OFFICES.map((o) => ({ value: o, label: o }))}
            value={office}
            onValueChange={handleOfficeChange}
            disabled={saving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select office" />
            </SelectTrigger>
            <SelectContent>
              {ESCALATION_OFFICES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={(v) => handleChange({ priority: v as CasePriority })} disabled={saving}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CASE_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Assigned to</Label>
        <Select
          items={[
            { value: "unassigned", label: "Unassigned" },
            ...staff.map((s) => ({ value: s.id, label: `${s.first_name} ${s.last_name}` })),
          ]}
          value={assignedTo ?? "unassigned"}
          onValueChange={(v) => handleChange({ assignedTo: v === "unassigned" ? null : v })}
          disabled={saving}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
