import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Vercel (and most proxies) set x-forwarded-for as "client, proxy1, proxy2"
// — the first entry is the real client. Falls back to a constant bucket
// (effectively "everyone shares one limit") if no IP is available, which
// only happens in local dev without a proxy in front.
async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(
  bucket: string,
  identity: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: `${bucket}:${identity}`,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });
  // Fail open on an infra error — a rate limiter that's down shouldn't take
  // the feature it's protecting down with it.
  if (error) return true;
  return data === true;
}

export async function checkIpRateLimit(bucket: string, maxAttempts: number, windowSeconds: number) {
  const ip = await getClientIp();
  return checkRateLimit(bucket, ip, maxAttempts, windowSeconds);
}
