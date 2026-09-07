"use client";

import Link from "next/link";
import {
  ClipboardList,
  MessageSquare,
  Megaphone,
  CalendarClock,
  Users,
  UserCheck,
  Bell,
} from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { NotificationKind, NotificationRecord } from "@/types/domain";

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  case_status_changed: ClipboardList,
  case_comment_added: MessageSquare,
  announcement_published: Megaphone,
  event_reminder: CalendarClock,
  club_announcement: Users,
  membership_decided: UserCheck,
};

export function NotificationItem({ notification }: { notification: NotificationRecord }) {
  const Icon = KIND_ICON[notification.kind] ?? Bell;

  function handleClick() {
    if (!notification.is_read) {
      markNotificationReadAction(notification.id);
    }
  }

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border p-3.5 transition-colors",
        notification.is_read ? "bg-card" : "border-primary/30 bg-primary/5"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          notification.is_read ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
        )}
      >
        <Icon size={15} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold leading-snug">{notification.title}</p>
        {notification.body && <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(notification.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
      {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </div>
  );

  if (!notification.link_url) {
    return (
      <button type="button" onClick={handleClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={notification.link_url} onClick={handleClick}>
      {content}
    </Link>
  );
}
