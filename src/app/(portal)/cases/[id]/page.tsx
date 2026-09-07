import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import {
  getCaseDetail,
  getCaseFeedback,
  listCaseAttachments,
  listCaseComments,
  listCaseHistory,
} from "@/lib/queries/cases";
import { StatusBadge } from "@/components/shared/status-badge";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { CaseAttachments } from "@/components/cases/case-attachments";
import { ReplyForm } from "@/components/cases/reply-form";
import { FeedbackForm } from "@/components/cases/feedback-form";
import { CASE_STATUS_DESCRIPTIONS } from "@/types/domain";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: caseRecord } = await getCaseDetail(id, user);
  if (!caseRecord) notFound();

  const [{ data: comments }, { data: history }, { data: attachments }, feedback] = await Promise.all([
    listCaseComments(id, caseRecord, user),
    listCaseHistory(id),
    listCaseAttachments(id),
    getCaseFeedback(id),
  ]);

  const publicComments = comments.filter((c) => !c.is_internal);
  const isResolved = caseRecord.status === "resolved";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/cases" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to cases
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold">{caseRecord.title}</h1>
            <p className="text-xs text-muted-foreground">
              {caseRecord.reference_number} · {caseRecord.case_categories?.name}
            </p>
          </div>
          <StatusBadge status={caseRecord.status} />
        </div>

        <p className="text-sm">{caseRecord.description}</p>
        <p className="text-xs text-muted-foreground">{CASE_STATUS_DESCRIPTIONS[caseRecord.status]}</p>

        <CaseAttachments caseId={id} attachments={attachments} canUpload />

        <CaseTimeline history={history} comments={publicComments} />

        <ReplyForm caseId={id} />

        {isResolved && !feedback && <FeedbackForm caseId={id} />}
        {feedback && (
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            You rated this resolution {feedback.rating}/5.
          </div>
        )}
      </div>
    </div>
  );
}
