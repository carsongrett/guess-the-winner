const CACHE_NAME = 'gtw-v2'; // Updated to force cache refresh
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icons/georgia.png',
  '/icons/alabama.png',
  '/data/games.json',
  '/data/teams.json',
  '/data/games-2025.json',
  '/data/teams-2025.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  
  // For data files, always fetch fresh and update cache
  if (req.url.includes('/data/')) {
    e.respondWith(
      fetch(req).then(response => {
        // Clone the response before caching
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(req, responseToCache);
        });
        return response;
      }).catch(() => {
        // If fetch fails, try cache as fallback
        return caches.match(req);
      })
    );
  } else {
    // For other assets, use cache-first strategy
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});
