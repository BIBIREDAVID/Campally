import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/types/domain";

// Single-tenant today (see 001_foundation_and_cases.sql) — "the active
// tenant" is just the first/only row. Once a second tenant exists, this is
// the one place that needs to change to resolve by request host/subdomain
// instead.
export async function getActiveTenant() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("*").limit(1).single();
  return data as Tenant | null;
}
