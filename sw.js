const CACHE_NAME = 'playbook-cache-v1';

// List of all the files your app needs to run offline
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './src/app.js',
  './src/field.js',
  './src/formations.js',
  './src/routes.js',
  './src/roster.js',
  './src/storage.js',
  './src/playbook.js',
  './src/lib/konva.min.js',
  './src/lib/anime.min.js'
];

// Install the Service Worker and save the files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve the cached files when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached version if we have it, otherwise fetch from the network
        return response || fetch(event.request);
      })
  );
});