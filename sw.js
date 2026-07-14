const CACHE_VERSION = 'v10';
const CACHE_NAME = `reader-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon512.png',
  './content/catalog.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== scopeUrl.origin) return;

  // Item content is network-first so updates remain fresh, with downloaded
  // resources available from the selective offline cache.
  if (requestUrl.pathname.includes('/content/items/')) {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch (error) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw error;
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'DOWNLOAD_ITEM') {
    const { itemId, urls } = event.data;
    event.waitUntil(downloadItem(itemId, urls, event.source));
  }
});

async function downloadItem(itemId, urls, client) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const uniqueUrls = [...new Set(urls)];
    let current = 0;
    client?.postMessage({ type: 'DOWNLOAD_PROGRESS', itemId, current, total: uniqueUrls.length, status: 'downloading' });

    for (const url of uniqueUrls) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      await cache.put(url, response.clone());
      current += 1;
      if (current % 5 === 0 || current === uniqueUrls.length) {
        client?.postMessage({
          type: 'DOWNLOAD_PROGRESS', itemId, current, total: uniqueUrls.length,
          status: current === uniqueUrls.length ? 'complete' : 'downloading',
        });
      }
    }
  } catch (error) {
    client?.postMessage({ type: 'DOWNLOAD_PROGRESS', itemId, status: 'error', error: error.message });
  }
}
