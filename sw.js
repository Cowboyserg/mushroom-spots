const CACHE_NAME = 'mushroom-spots-v0.7.12';
const APP_ASSET_VERSION = '0.7.12';

// Keep only the application shell in cache.
// Do NOT intercept Supabase/API requests. Do NOT cache POST requests.
// config.js/config.json, user offline-map-packages.json, and .pmtiles packages are intentionally not pre-cached.
// This keeps GitHub Pages uploads from overwriting or depending on user map manifests.
const APP_SHELL = [
  './',
  './index.html',
  `./styles.css?v=${APP_ASSET_VERSION}`,
  `./app.js?v=${APP_ASSET_VERSION}`,
  `./leaflet-offline-lite.js?v=${APP_ASSET_VERSION}`,
  `./manifest.webmanifest?v=${APP_ASSET_VERSION}`,
  './icon.svg',
  `./apple-touch-icon.svg?v=${APP_ASSET_VERSION}`
];

const APP_SHELL_PATHS = new Set([
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/leaflet-offline-lite.js',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.svg'
]);

async function clearAllVisibleCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

function isAppShellRequest(url) {
  const path = url.pathname;
  return APP_SHELL_PATHS.has(path) ||
    path.endsWith('/') ||
    path.endsWith('/index.html') ||
    path.endsWith('/styles.css') ||
    path.endsWith('/app.js') ||
    path.endsWith('/leaflet-offline-lite.js') ||
    path.endsWith('/manifest.webmanifest') ||
    path.endsWith('/icon.svg') ||
    path.endsWith('/apple-touch-icon.svg') ||
    url.searchParams.has('app_reload') ||
    url.searchParams.has('app_version') ||
    url.searchParams.has('v');
}

function networkRequestFor(req, url) {
  if (isAppShellRequest(url)) {
    // On Android PWA/WebView the HTTP cache can keep an older app.js even after
    // Cache Storage is deleted. cache:'reload' forces a revalidation/fresh fetch
    // for versioned app-shell assets while preserving normal runtime behavior.
    return new Request(req, { cache: 'reload' });
  }
  return req;
}

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

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'MUSHROOM_CLEAR_APP_CACHE') {
    event.waitUntil(clearAllVisibleCaches());
  }
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
    url.pathname.endsWith('.pmtiles') ||
    url.pathname.endsWith('/config.js') ||
    url.pathname.endsWith('/config.json') ||
    url.pathname.endsWith('/offline-map-packages.json')
  ) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);

    try {
      const res = await fetch(networkRequestFor(req, url));

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
