self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Simple pass-through fetch to allow PWA installability without complex caching
  e.respondWith(fetch(e.request).catch(() => new Response("Offline Mode not fully supported.")));
});
