// Service Worker for RealTV
// Provides aggressive caching for external resources (Azure CDN, Wikimedia)
// to improve Lighthouse scores and reduce network payload on repeat visits

const CACHE_NAME = 'realtv-cache-v1';
const EXTERNAL_IMAGE_CACHE = 'realtv-external-images-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// External domains to cache with long TTL (365 days)
const EXTERNAL_DOMAINS = [
  'upload.wikimedia.org',
  '03mcdecdnimagerepository.blob.core.windows.net',
  'i.ytimg.com'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== EXTERNAL_IMAGE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Check if request is for an external image
  const isExternalImage = EXTERNAL_DOMAINS.some(domain => url.hostname.includes(domain));
  
  if (isExternalImage) {
    // Cache-first strategy for external images (long TTL)
    event.respondWith(
      caches.open(EXTERNAL_IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return a fallback if fetch fails
            return new Response('Image unavailable', { status: 503 });
          });
        });
      })
    );
  } else if (event.request.destination === 'image') {
    // Cache-first for local images
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  } else {
    // Network-first for HTML/JS/CSS
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
