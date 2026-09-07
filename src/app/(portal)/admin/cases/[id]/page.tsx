import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import {
  getCaseDetail,
  listCaseAttachments,
  listCaseComments,
  listCaseHistory,
} from "@/lib/queries/cases";
import { listStaffUsers } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/shared/status-badge";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { CaseAttachments } from "@/components/cases/case-attachments";
import { AdminCaseControls } from "@/components/cases/admin-case-controls";
import { AdminCommentPanels } from "@/components/cases/admin-comment-panels";
import { RevealIdentityButton } from "@/components/cases/reveal-identity-button";

export default async function AdminCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "cases.manage")) redirect("/");

  const { data: caseRecord } = await getCaseDetail(id, user);
  if (!caseRecord) notFound();

  const [{ data: comments }, { data: history }, { data: attachments }, staff] = await Promise.all([
    listCaseComments(id, caseRecord, user),
    listCaseHistory(id),
    listCaseAttachments(id),
    listStaffUsers(),
  ]);

  const publicComments = comments.filter((c) => !c.is_internal);
  const internalComments = comments.filter((c) => c.is_internal);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link href="/admin/cases" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to cases
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">{caseRecord.title}</h1>
              <p className="text-xs text-muted-foreground">
                {caseRecord.reference_number} · {caseRecord.case_categories?.name} ·{" "}
                {caseRecord.users
                  ? `${caseRecord.users.first_name} ${caseRecord.users.last_name}`
                  : "Anonymous"}
              </p>
            </div>
            <StatusBadge status={caseRecord.status} />
          </div>

          {!caseRecord.users && caseRecord.is_anonymous && hasPermission(user, "cases.reveal_anonymous") && (
            <RevealIdentityButton caseId={id} />
          )}

          <p className="text-sm">{caseRecord.description}</p>
          {caseRecord.escalated_to_office && (
            <p className="text-xs text-muted-foreground">
              Escalated to: <span className="font-medium text-foreground">{caseRecord.escalated_to_office}</span>
            </p>
          )}

          <CaseAttachments caseId={id} attachments={attachments} canUpload={false} />

          <CaseTimeline history={history} comments={publicComments} />

          <AdminCommentPanels caseId={id} publicComments={publicComments} internalComments={internalComments} />
        </div>

        <AdminCaseControls
          caseId={id}
          status={caseRecord.status}
          priority={caseRecord.priority}
          assignedTo={caseRecord.assigned_to}
          escalatedToOffice={caseRecord.escalated_to_office}
          staff={staff}
        />
      </div>
    </div>
  );
}
