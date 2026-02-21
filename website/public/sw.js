// Proof of Planet — Service Worker
// Handles offline caching for the /mine PWA only

const CACHE_NAME = "poh-mine-v2";
const STATIC_ASSETS = [
  "/mine",
  "/mine/setup",
  "/manifest.json",
  "/logo/poh-token-128x128.png",
  "/logo/poh-token-256x256.png",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: only cache /mine routes and static assets — leave other pages alone
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle /mine pages and static assets (images, fonts, etc.)
  const isMineRoute = url.pathname.startsWith("/mine");
  const isStaticAsset = url.pathname.startsWith("/logo/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.json";

  // Skip API calls and non-mine pages entirely
  if (url.pathname.startsWith("/api/") || (!isMineRoute && !isStaticAsset)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
