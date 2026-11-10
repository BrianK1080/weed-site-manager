// Service worker: keeps the app working offline.
// App files: cached on install. Map tiles: the ones you have viewed are kept (up to a limit),
// so recently seen areas still show without reception. No site data passes through here.
const VERSION = 'wsm-v14';
const SHELL = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'js/app.js', 'js/db.js', 'js/season.js', 'js/species.js', 'js/weedpack.js', 'js/export.js',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'vendor/leaflet/images/layers.png', 'vendor/leaflet/images/layers-2x.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png',
];
const TILE_CACHE = 'wsm-tiles';
const TILE_LIMIT = 3000;
const TILE_HOSTS = ['tile.openstreetmap.org', 'server.arcgisonline.com', 'opendata.maps.vic.gov.au'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== TILE_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trimTiles() {
  const c = await caches.open(TILE_CACHE);
  const keys = await c.keys();
  if (keys.length > TILE_LIMIT) for (const k of keys.slice(0, keys.length - TILE_LIMIT)) await c.delete(k);
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (TILE_HOSTS.includes(url.hostname)) {
    // Network first for tiles so imagery stays fresh; fall back to the cached copy offline.
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(TILE_CACHE).then(c => c.put(e.request, copy)).then(trimTiles);
      }
      return res;
    }).catch(() => caches.match(e.request)));
    return;
  }
  if (url.origin === location.origin) {
    // Cache first for app files, refreshed in the background.
    e.respondWith(caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
