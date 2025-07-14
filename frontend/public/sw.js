// sw.js - Simplified Service Worker
const CACHE_NAME = 'zenlist-v1.3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/zenList-192.png',
  '/zenList-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Add URLs one by one to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'ZenList',
    body: 'You have a new task notification',
    icon: '/zenList-192.png',
    badge: '/zenList-192.png',
    tag: 'zenlist-notification',
    vibrate: [200, 100, 200],
    data: {
      timestamp: Date.now(),
      url: '/'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: {
          ...data,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const clickUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      // Open new window if no existing one
      return self.clients.openWindow(clickUrl);
    })
  );
});

console.log('Service Worker loaded successfully');