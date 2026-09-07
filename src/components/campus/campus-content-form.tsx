"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCampusContentAction, updateCampusContentAction } from "@/lib/actions/campus";
import {
  CAMPUS_CATEGORIES,
  CAMPUS_CATEGORY_LABELS,
  type CampusContent,
  type CampusContentCategory,
} from "@/types/domain";

interface Props {
  existing?: CampusContent;
}

export function CampusContentForm({ existing }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [category, setCategory] = useState<CampusContentCategory>(existing?.category ?? "academic");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = { title, body, category, status: publish ? ("published" as const) : ("draft" as const) };
    const result = existing
      ? await updateCampusContentAction(existing.id, input)
      : await createCampusContentAction(input);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/campus");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <Select
          items={CAMPUS_CATEGORIES.map((c) => ({ value: c, label: CAMPUS_CATEGORY_LABELS[c] }))}
          value={category}
          onValueChange={(v) => v && setCategory(v as CampusContentCategory)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAMPUS_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CAMPUS_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">
          {category === "faq" ? "Answer (write the question as the title above)" : "Content"}
        </Label>
        <Textarea id="body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} required />
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting || !title.trim() || !body.trim()}
          onClick={(e) => handleSubmit(e, false)}
        >
          Save as draft
        </Button>
        <Button
          type="button"
          disabled={submitting || !title.trim() || !body.trim()}
          onClick={(e) => handleSubmit(e, true)}
        >
          {submitting ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}
