import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/queries/current-user";
import { getActiveTenant } from "@/lib/queries/tenant";
import { TenantBrandingForm } from "@/components/admin/tenant-branding-form";

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user, "tenant.manage")) redirect("/");

  const tenant = await getActiveTenant();
  if (!tenant) redirect("/");

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Student Union Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Branding for this Student Union. Union currently runs one institution at a time — these
          settings apply site-wide.
        </p>
      </div>
      <TenantBrandingForm tenant={tenant} />
    </div>
  );
}
