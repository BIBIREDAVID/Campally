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
  eyebrow?: string;
}

// The featured/hero treatment at the top of News, Events, and Campus Info —
// deliberately spare (one item, not a carousel) so it stays fast and never
// competes with the grid below for attention.
export function FeaturedCard({ href, title, description, imageUrl, tags, eyebrow }: Props) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary sm:flex-row sm:items-center"
    >
      <div
        className={cn(
          "h-40 w-full shrink-0 rounded-xl bg-muted sm:h-32 sm:w-48",
          imageUrl && "bg-cover bg-center"
        )}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      <div className="flex flex-1 flex-col gap-2">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-wide text-primary">{eyebrow}</p>}
        <h2 className="text-lg font-bold leading-snug">{title}</h2>
        {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
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
      </div>
    </Link>
  );
}
