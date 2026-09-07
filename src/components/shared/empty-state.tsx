import { type LucideIcon } from "lucide-react";
import { Illustration } from "@/components/shared/illustration";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// The shared "nothing here yet" moment, used everywhere a list can be
// empty — News, Events, Clubs, Deals, Campus, Cases, Notifications, Search.
// One component so the illustrated treatment reads as one system rather
// than each screen inventing its own empty block.
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
      <Illustration icon={icon} className="h-20 w-20" />
      <div>
        <p className="text-base font-bold text-foreground">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
