"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignRoleAction, revokeRoleAction } from "@/lib/actions/admin";

interface Role {
  id: string;
  name: string;
}

interface Props {
  userId: string;
  allRoles: Role[];
  assignedRoles: Role[];
}

export function RoleAssignmentPanel({ userId, allRoles, assignedRoles }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedIds = new Set(assignedRoles.map((r) => r.id));
  const availableRoles = allRoles.filter((r) => !assignedIds.has(r.id));

  async function handleAssign() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    const result = await assignRoleAction(userId, selected);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSelected("");
    router.refresh();
  }

  async function handleRevoke(roleId: string) {
    setSubmitting(true);
    setError(null);
    const result = await revokeRoleAction(userId, roleId);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {assignedRoles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles assigned — standard student access only.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {assignedRoles.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-primary"
            >
              {r.name}
              <button
                type="button"
                onClick={() => handleRevoke(r.id)}
                disabled={submitting}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
                aria-label={`Revoke ${r.name}`}
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {availableRoles.length > 0 && (
        <div className="flex items-center gap-2">
          <Select items={availableRoles.map((r) => ({ value: r.id, label: r.name }))} value={selected} onValueChange={(v) => setSelected(v ?? "")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Assign a role..." />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={handleAssign} disabled={!selected || submitting}>
            {submitting ? "Assigning..." : "Assign"}
          </Button>
        </div>
      )}
    </div>
  );
}
