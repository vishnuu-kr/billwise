const CACHE_NAME = 'billwise-v0.6.0-rc2';
const OFFLINE_URLS = [
  '/',
  '/predict',
  '/manual',
  '/what-if',
  '/tariff',
  '/history',
  '/feedback',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache strategy:
// 1. Immutable static assets (hashed JS/CSS chunks, fonts, icons) -> Cache-first for instant loading
// 2. HTML navigation routes -> Network-first with offline cache fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never cache API, telemetry, or Next.js RSC prefetch requests
  if (
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    event.request.headers.get('RSC') === '1' ||
    event.request.headers.get('Next-Router-Prefetch') === '1' ||
    event.request.headers.get('Next-Router-State-Tree') !== null
  ) {
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
