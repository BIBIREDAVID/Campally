import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  kind: "news" | "event" | "club" | "campus" | "deal";
  id: string;
  title: string;
  snippet: string | null;
  url: string;
  rank: number;
}

// V1 is single-tenant, so an anonymous searcher (no profile to read a
// tenant_id from) just gets the one tenant that exists. This is the one
// place that assumption is made explicit — a future multi-tenant search
// would resolve this from the request's hostname instead.
export async function getDefaultTenantId() {
  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("id").limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function globalSearch(query: string, tenantId: string) {
  if (!query.trim()) return { data: [] as SearchResult[], error: null };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("global_search", {
    search_query: query,
    for_tenant: tenantId,
  });

  return { data: (data ?? []) as SearchResult[], error };
}
