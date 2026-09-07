// Resolves the app's own public URL for building redirect links (auth
// email confirmations, etc). NEXT_PUBLIC_SITE_URL wins when set — that's
// how Production gets a stable custom-domain URL. Preview and branch
// deployments don't have (and shouldn't have) one fixed URL each, so they
// fall back to Vercel's own VERCEL_URL, which is unique per deployment and
// injected automatically — no per-preview configuration needed.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
