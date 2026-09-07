// Union — minimal offline shell.
//
// Deliberately conservative: this only ever serves cached GETs (pages,
// static assets). It never intercepts POST/PUT/DELETE, so a case
// submission or any other write always hits the real network and fails
// loudly if there isn't one — per the product rule that a write must never
// show a false "submitted" state. Caching writes for background replay is
// a deliberate V2 decision, not an oversight.

const CACHE_VERSION = "union-shell-v1";
const OFFLINE_URL = "/offline.html";
const APP_SHELL = ["/", "/campus", "/offline.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever cache-serve safe, idempotent reads.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Full-page navigations: try the network first (so logged-in, personalised
  // pages stay fresh), fall back to a cached copy, then to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Static assets (_next/static, fonts, icons): cache-first, since they're
  // content-hashed and never change under the same URL.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon-") || url.pathname.endsWith(".woff2")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
