// DCC Character Sheet Service Worker
const CACHE_NAME = 'dcc-character-sheet-v2.0.0';
const urlsToCache = [
  './',
  './index.html',
  './main.js',
  './character-manager.js',
  './improvements.js',
  './achievements.js',
  './achievements.json',
  './style.css',
  './style.modern.css',
  './style.old.css',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('DCC Character Sheet: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('DCC Character Sheet: Cache install failed:', error);
      })
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', function(event) {
  // For JavaScript files, always try network first to get updates
  if (event.request.url.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .then(function(networkResponse) {
          // Update cache with new version
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(function() {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } else {
    // For other files, use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }
          return fetch(event.request);
        }
      )
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('DCC Character Sheet: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for character data
self.addEventListener('sync', function(event) {
  if (event.tag === 'character-sync') {
    event.waitUntil(
      // Sync character data when connection is restored
      console.log('DCC Character Sheet: Background sync triggered')
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

