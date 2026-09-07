import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  kind: "news" | "event" | "club" | "campus" | "deal";
  id: string;
  title: string;
  snippet: string | null;
  url: string;
  rank: number;
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
