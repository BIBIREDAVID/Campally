import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Illustration } from "@/components/shared/illustration";
import { cn } from "@/lib/utils";

interface Props {
  href: string;
  title: string;
  imageUrl?: string | null;
  fallbackIcon: LucideIcon;
  category?: string;
  meta?: string;
  statusBadge: React.ReactNode;
  className?: string;
}

// The admin-side counterpart to ContentCard — same image-on-top shape and
// hover treatment, so the admin console reads as the same product as the
// student pages instead of a bolted-on internal tool. Status badge (not a
// free-form tag list) is the one deliberate difference: admins scan for
// draft/published/archived first, everything else is secondary.
export function AdminContentCard({ href, title, imageUrl, fallbackIcon, category, meta, statusBadge, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary",
        className
      )}
    >
      <div className="-mx-4 -mt-4 h-28 w-[calc(100%+2rem)] overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static asset
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Illustration icon={fallbackIcon} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold leading-snug">{title}</h3>
        {statusBadge}
      </div>
      {category && <p className="text-xs text-muted-foreground">{category}</p>}
      {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
    </Link>
  );
}
