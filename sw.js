// Ratlam Hospital CRM - Service Worker for Offline-First Support (sw.js)
const CACHE_NAME = "ratlam-cache-v34";
const ASSETS = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "dashboard.html",
  "addlead.html",
  "leads.html",
  "addmeeting.html",
  "meetings.html",
  "reports.html",
  "admin.html",
  "icon-192.png",
  "icon-512.png",
  "icon.svg"
];

// Install Event - Pre-cache Static Shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching static app shell");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up outdated caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener("fetch", (e) => {
  // Ignore Apps Script API requests or external HTTP posts (sync requests should not be cached)
  if (e.request.url.includes("script.google.com") || e.request.method !== "GET") {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        const fetchedResponse = fetch(e.request).then((networkResponse) => {
          // If valid response, update cache in background
          if (networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Silent catch, offline error handled gracefully
        });

        // Return cached version immediately if available, else wait for network fetch
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
