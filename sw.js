const CACHE_VERSION = 'v8';
const CACHE_NAME = `reader-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  './',
  './index.html',
  './converter.js',
  './converter.css',
  './manifest.json',
  './icon512.png',
  './content-index.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting(); // activate updated worker immediately
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))));
    await self.clients.claim(); // take control of open tabs
  })());
});

// Network-first: always try fresh content, fall back to cache when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const { request } = event;

  // Only handle same-origin requests to avoid extension/third-party noise.
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== scopeUrl.origin) return;

  // Bypass cache logic for book content to always hit the freshest markdown.
  // However, if offline, fall back to cache for downloaded content.
  if (requestUrl.pathname.includes('/content/books/')) {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch (err) {
        // If fetch fails (offline), try cache
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (err) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      throw err;
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'DOWNLOAD_BOOK') {
    const { bookId, urls } = event.data;
    downloadBook(bookId, urls, event.source);
  }
});

async function downloadBook(bookId, urls, client) {
  try {
    const cache = await caches.open(CACHE_NAME);
    let current = 0;
    const total = urls.length;
    
    // Send initial progress
    client.postMessage({
      type: 'DOWNLOAD_PROGRESS',
      bookId,
      current: 0,
      total,
      status: 'downloading'
    });

    for (const url of urls) {
      try {
        // Try to fetch the resource
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
        // Note: We don't fail the entire download if one file is missing (e.g., optional _q.json files)
      } catch (err) {
        // Log but continue with other files
        console.warn(`Failed to cache ${url}:`, err);
      }
      
      current++;
      
      // Send progress update every 5 files or at the end
      if (current % 5 === 0 || current === total) {
        client.postMessage({
          type: 'DOWNLOAD_PROGRESS',
          bookId,
          current,
          total,
          status: current === total ? 'complete' : 'downloading'
        });
      }
    }
  } catch (error) {
    client.postMessage({
      type: 'DOWNLOAD_PROGRESS',
      bookId,
      status: 'error',
      error: error.message
    });
  }
}
