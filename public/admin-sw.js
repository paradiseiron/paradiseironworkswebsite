const CACHE_VERSION = "paradise-admin-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = "/admin/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/admin/icons/icon-192.png",
  "/admin/icons/icon-512.png",
  "/admin/icons/icon-maskable-512.png",
  "/admin/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("paradise-admin-") && key !== STATIC_CACHE)
              .map((key) => caches.delete(key))
          )
        ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "New website lead",
    body: "A new quote request was received.",
    url: "/admin/projects",
    tag: "website-lead"
  };
  const payload = event.data ? event.data.json() : fallback;

  event.waitUntil(
    self.registration.showNotification(payload.title || fallback.title, {
      body: payload.body || fallback.body,
      icon: "/admin/icons/icon-192.png",
      badge: "/admin/icons/icon-192.png",
      tag: payload.tag || fallback.tag,
      data: { url: payload.url || fallback.url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = event.notification.data?.url || "/admin/projects";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find((client) =>
          client.url.includes("/admin")
        );

        if (existingClient) {
          existingClient.navigate(destination);
          return existingClient.focus();
        }

        return self.clients.openWindow(destination);
      })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  const isPrecachedAsset = PRECACHE_URLS.includes(url.pathname);
  const isNextStaticAsset = url.pathname.startsWith("/_next/static/");

  if (isPrecachedAsset || isNextStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
