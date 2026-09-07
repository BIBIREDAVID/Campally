"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, FileText, Loader2 } from "lucide-react";
import { getCaseAttachmentUrlAction, uploadCaseAttachmentAction } from "@/lib/actions/cases";
import type { CaseAttachment } from "@/types/domain";

interface Props {
  caseId: string;
  attachments: CaseAttachment[];
  canUpload: boolean;
}

export function CaseAttachments({ caseId, attachments, canUpload }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadCaseAttachmentAction(caseId, formData);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleOpen(path: string) {
    const result = await getCaseAttachmentUrlAction(path);
    if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
  }

  if (attachments.length === 0 && !canUpload) return null;

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-destructive">{error}</p>}

      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => handleOpen(a.file_url)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <FileText size={13} />
                {a.file_url.split("/").pop()}
              </button>
            </li>
          ))}
        </ul>
      )}

      {canUpload && (
        <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
          {uploading ? "Uploading..." : "Attach a photo or document"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileSelected}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}

