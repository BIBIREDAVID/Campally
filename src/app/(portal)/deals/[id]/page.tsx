import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Tag, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/queries/current-user";
import { getDealDetail } from "@/lib/queries/deals";
import { SaveDealButton } from "@/components/deals/save-deal-button";
import { DEAL_CATEGORY_LABELS } from "@/types/domain";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: deal } = await getDealDetail(id, user.profile.id);
  if (!deal || deal.status === "draft") notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/deals" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Back to deals
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          {deal.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL
            <img src={deal.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{DEAL_CATEGORY_LABELS[deal.category]}</p>
            <h1 className="text-lg font-bold">{deal.merchant_name}</h1>
            <p className="text-sm font-semibold text-primary">{deal.discount_summary}</p>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{deal.description}</p>

        {deal.eligibility && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Eligibility: </span>
            {deal.eligibility}
          </p>
        )}

        {deal.promo_code && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2">
            <Tag size={14} className="text-primary" />
            <span className="font-mono text-sm font-bold tracking-wide">{deal.promo_code}</span>
          </div>
        )}

        {deal.redemption_instructions && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">How to redeem: </span>
            {deal.redemption_instructions}
          </p>
        )}

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {deal.locations && (
            <span className="flex items-center gap-2">
              <MapPin size={14} /> {deal.locations}
            </span>
          )}
          {deal.contact_info && (
            <span className="flex items-center gap-2">
              <Phone size={14} /> {deal.contact_info}
            </span>
          )}
          {deal.external_url && (
            <a href={deal.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
              <ExternalLink size={14} /> Visit website
            </a>
          )}
          {deal.expires_at && (
            <span>Valid until {new Date(deal.expires_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
          )}
        </div>

        {deal.terms && <p className="text-xs text-muted-foreground">{deal.terms}</p>}

        <SaveDealButton dealId={id} initialSaved={!!deal.viewer_has_saved} />
      </div>
    </div>
  );
}
