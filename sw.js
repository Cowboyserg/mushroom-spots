const CACHE_NAME = 'mushroom-spots-v0.6.13-sprint4.13';

// Keep only the application shell in cache.
// Do NOT intercept Supabase/API requests. Do NOT cache POST requests.
// config.js and large .pmtiles packages are intentionally not pre-cached.
// offline-map-packages.json is small app metadata and is safe to cache.
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './leaflet-offline-lite.js',
  './manifest.webmanifest',
  './offline-map-packages.json',
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
  // Let the browser handle Supabase, map tiles, CDN files, PMTiles range reads,
  // and every non-GET request. This prevents "FetchEvent.respondWith / Failed to fetch"
  // caused by the service worker trying to cache API calls, POST bodies, or partial
  // byte-range responses from large offline map packages.
  if (
    req.method !== 'GET' ||
    url.origin !== self.location.origin ||
    req.headers.has('range') ||
    url.pathname.endsWith('.pmtiles')
  ) {
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
