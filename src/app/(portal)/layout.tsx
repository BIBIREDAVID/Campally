import { getCurrentUser, isAdminUser } from "@/lib/queries/current-user";
import { countUnreadNotifications } from "@/lib/queries/notifications";
import { AppShell } from "@/components/shared/app-shell";

// No redirect here on purpose — content routes (Home, News, Events, Clubs,
// Campus, Deals) are browsable without an account and personalise
// themselves when a session exists. Identity-specific routes (Cases,
// Profile, Notifications, Admin) are blocked for anonymous visitors by the
// middleware and, redundantly, by their own page-level guards — this
// layout only has to render the right shell for whichever case applies.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unreadNotifications = user ? await countUnreadNotifications(user.profile.id) : 0;

  return (
    <AppShell
      isAuthenticated={!!user}
      isAdmin={isAdminUser(user)}
      displayName={user ? `${user.profile.first_name} ${user.profile.last_name}` : ""}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </AppShell>
  );
}
