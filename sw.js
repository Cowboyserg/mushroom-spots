const CACHE_NAME = 'mushroom-spots-v0.5.9-sprint3.10';

// Keep only the application shell in cache.
// Do NOT intercept Supabase/API requests. Do NOT cache POST requests.
// config.js is intentionally not pre-cached, so key/URL fixes are picked up quickly.
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './apple-touch-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Critical rule:
  // Let the browser handle Supabase, map tiles, CDN files, and every non-GET request.
  // This prevents "FetchEvent.respondWith / Failed to fetch" caused by the service worker
  // trying to cache API calls or POST bodies.
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);

    try {
      const res = await fetch(req);

      // Cache only successful same-origin GET responses.
      if (res && res.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }

      return res;
    } catch (err) {
      if (cached) return cached;

      return new Response('Offline and no cached response is available.', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
