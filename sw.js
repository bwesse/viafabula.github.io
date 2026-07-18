const CACHE_VERSION = 'v13';
const CACHE_NAME = `reader-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  './',
  './index.html',
  './library.html',
  './vocabulary.html',
  './assets/app.css',
  './assets/sidebar.js',
  './assets/downloads.js',
  './assets/library.js',
  './assets/vocabulary-store.js',
  './assets/vocabulary.js',
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

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;
        const navigationFallback = requestUrl.pathname.endsWith('/library.html')
          ? './library.html'
          : requestUrl.pathname.endsWith('/vocabulary.html')
            ? './vocabulary.html'
            : './index.html';
        const fallback = await caches.match(navigationFallback);
        if (fallback) return fallback;
        throw error;
      }
    })());
    return;
  }

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
    const running = activeDownloads.get(itemId);
    if (running) {
      if (event.source) running.clients.add(event.source);
      event.source?.postMessage({ type: 'DOWNLOAD_PROGRESS', itemId, current: running.current, total: running.total, status: 'downloading' });
      event.waitUntil(running.promise);
      return;
    }
    const job = { clients: new Set(event.source ? [event.source] : []), current: 0, total: [...new Set(urls)].length, promise: null };
    job.promise = downloadItem(itemId, urls, job).finally(() => activeDownloads.delete(itemId));
    activeDownloads.set(itemId, job);
    event.waitUntil(job.promise);
  }
});

const activeDownloads = new Map();

function notifyDownload(job, message) {
  job.clients.forEach((client) => client.postMessage(message));
}

async function downloadItem(itemId, urls, job) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const uniqueUrls = [...new Set(urls)];
    let current = 0;
    notifyDownload(job, { type: 'DOWNLOAD_PROGRESS', itemId, current, total: uniqueUrls.length, status: 'downloading' });

    for (const url of uniqueUrls) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      await cache.put(url, response.clone());
      current += 1;
      job.current = current;
      if (current % 5 === 0 || current === uniqueUrls.length) {
        notifyDownload(job, {
          type: 'DOWNLOAD_PROGRESS', itemId, current, total: uniqueUrls.length,
          status: current === uniqueUrls.length ? 'complete' : 'downloading',
        });
      }
    }
  } catch (error) {
    notifyDownload(job, { type: 'DOWNLOAD_PROGRESS', itemId, status: 'error', error: error.message });
  }
}
