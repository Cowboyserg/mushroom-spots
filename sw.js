const CACHE_NAME = 'mushroom-spots-v0.5.0';
const APP_SHELL = ['./', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest', './icon.svg', './apple-touch-icon.svg'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
    }
    return res;
  }).catch(() => cached)));
});
