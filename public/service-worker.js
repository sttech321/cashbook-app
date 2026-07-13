// Basic service worker for PWA installability
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A fetch handler is required by Chromium to show the install prompt.
  // We can just respond normally for now.
  event.respondWith(fetch(event.request));
});
