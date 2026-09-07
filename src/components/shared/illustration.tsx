import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  className?: string;
  iconSize?: number;
}

// A small, reusable "colorful moment" — a soft cluster of hand-drawn-ish
// blobs in the illustration palette, with a line icon centered on top.
// Deliberately built as a handful of inline <path>/<circle> primitives
// (a few hundred bytes, no external asset) rather than imported artwork —
// gives every empty state, card image slot, and hero the same illustrated
// character without the payload cost that direction usually carries.
// preserveAspectRatio="slice" so it fills wide rectangular slots (card
// image strips) by cropping rather than letterboxing a square graphic.
export function Illustration({ icon: Icon, className, iconSize = 30 }: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
        <circle cx="58" cy="52" r="50" fill="var(--illo-coral)" opacity="0.3" />
        <path
          d="M124 66c24 9 32 38 15 57-17 19-49 22-70 9-23-14-33-46-18-68 13-20 48-7 73 2z"
          fill="var(--illo-blue)"
          opacity="0.24"
        />
        <circle cx="118" cy="42" r="20" fill="var(--illo-gold)" opacity="0.35" />
        <circle cx="40" cy="118" r="26" fill="var(--illo-mint)" opacity="0.3" />
        <circle cx="130" cy="122" r="14" fill="var(--illo-grape)" opacity="0.25" />
      </svg>
      <Icon
        size={iconSize}
        strokeWidth={1.75}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground/70"
      />
    </div>
  );
}
