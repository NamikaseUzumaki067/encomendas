const CACHE_NAME = "nova-saude-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./historico.html",
  "./login.html",
  "./register.html",
  "./manifest.webmanifest",

  "./css/styles.css",

  "./js/app.js",
  "./js/chart.js",
  "./js/theme.js",

  "./js/core/layout.js",
  "./js/core/router.js",
  "./js/core/ui.js",

  "./js/data/api.js",
  "./js/data/auth.js",
  "./js/data/storage.js",

  "./js/pages/dashboard.js",
  "./js/pages/historico.js",
  "./js/pages/login.js",
  "./js/pages/register.js",

  "./js/services/audit.js",
  "./js/services/export.js",

  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});