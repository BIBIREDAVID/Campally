import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
  priority?: boolean;
  /** Most places the logo sits next to visible "Union" text, so the image
   *  itself should stay decorative (alt=""). Pass a real alt only where it
   *  stands alone with no adjacent text conveying the same thing. */
  alt?: string;
}

// The LASUSU crest is navy line-art on a transparent background — designed
// to sit on light paper. Dropped directly onto a dark surface, those thin
// navy strokes lose almost all contrast and read as a muddy smudge. Rather
// than recolour a real institutional crest for dark mode (its colours mean
// something — they're not ours to reinterpret), it always sits on a small
// light plate, styled like a pin/badge rather than a logo mistake.
export function Logo({ size = 32, className, priority, alt = "" }: Props) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-white p-[3px] shadow-sm ring-1 ring-black/5", className)}
      style={{ width: size, height: size }}
    >
      <Image src="/logo.png" alt={alt} width={size} height={size} className="h-full w-full object-contain" priority={priority} />
    </span>
  );
}
