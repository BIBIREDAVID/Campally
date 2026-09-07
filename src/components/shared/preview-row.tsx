import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Illustration } from "@/components/shared/illustration";

interface Props {
  href: string;
  title: string;
  meta?: string;
  imageUrl?: string | null;
  fallbackIcon: LucideIcon;
}

// A thumbnail + title + meta row — the compact counterpart to ContentCard,
// used for feed-style previews (home page sections) where a full card grid
// would be too heavy. Same rule as ContentCard: always an image, real or
// illustrated, never bare text.
export function PreviewRow({ href, title, meta, imageUrl, fallbackIcon }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:border-primary"
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static asset
          <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Illustration icon={fallbackIcon} className="h-full w-full" iconSize={18} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
    </Link>
  );
}
