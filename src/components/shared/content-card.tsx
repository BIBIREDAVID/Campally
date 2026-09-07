import Link from "next/link";
import { cn } from "@/lib/utils";

interface Tag {
  label: string;
  variant?: "default" | "urgent";
}

interface Props {
  href: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  tags?: Tag[];
  meta?: string;
  className?: string;
}

// Shared card shape for News, Events, and Campus Info list/grid views.
export function ContentCard({ href, title, description, imageUrl, tags, meta, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary",
        className
      )}
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a static asset
        <img src={imageUrl} alt="" className="h-32 w-full rounded-lg object-cover" loading="lazy" />
      )}
      <h3 className="font-bold leading-snug">{title}</h3>
      {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                tag.variant === "urgent"
                  ? "bg-[color-mix(in_oklch,var(--status-urgent)_12%,transparent)] text-[var(--status-urgent)]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
      {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
    </Link>
  );
}
