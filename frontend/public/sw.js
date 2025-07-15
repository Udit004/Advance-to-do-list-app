// Enhanced sw.js - Mobile-optimized Service Worker
const CACHE_NAME = 'zenlist-v2.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/zenList-192.png',
  '/zenList-512.png',
  '/offline.html' // Add offline page
];

// Install event with enhanced caching
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Add URLs one by one to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log('Cache populated, skipping waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event with enhanced cleanup
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activated and claimed all clients');
    })
  );
});

// Enhanced fetch event with mobile-specific handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - try network first, then show offline message
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'offline', 
            message: 'You are currently offline' 
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
  } else {
    // Static assets and pages - cache first, then network
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Otherwise, fetch from network
          return fetch(request).then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseToCache = response.clone();
            
            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          });
        })
        .catch(() => {
          // If both cache and network fail, show offline page for document requests
          if (request.destination === 'document') {
            return caches.match('/offline.html') || caches.match('/');
          }
          
          // For other requests, return a basic offline response
          return new Response('Offline', { status: 503 });
        })
    );
  }
});

// Enhanced push event with mobile-specific features
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  // Default notification data optimized for mobile
  let notificationData = {
    title: 'ZenList',
    body: 'You have a new task notification',
    icon: '/zenList-192.png',
    badge: '/zenList-192.png',
    tag: 'zenlist-notification',
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    silent: false,
    requireInteraction: true, // Keep notification until user interacts (mobile)
    data: {
      timestamp: Date.now(),
      url: '/',
      source: 'push'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/zenList-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/zenList-192.png'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: {
          ...notificationData.data,
          ...data.data,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Show notification with enhanced mobile features
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('Notification shown successfully');
        
        // Send analytics or logging data
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_SHOWN',
              data: notificationData
            });
          });
        });
      })
      .catch(error => {
        console.error('Failed to show notification:', error);
      })
  );
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const { notification, action } = event;
  
  // Close the notification
  notification.close();
  
  // Handle different actions
  if (action === 'dismiss') {
    // Just close the notification
    return;
  }
  
  // Default action or 'open' action
  const clickUrl = notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clients) => {
      // Try to focus existing window
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(() => {
            // Send message to client about notification click
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notification.data
            });
          });
        }
      }
      
      // Open new window if no existing one
      return self.clients.openWindow(clickUrl).then(client => {
        // Send message to new client
        if (client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: notification.data
          });
        }
      });
    })
  );
});

// Background sync for offline actions (useful for mobile)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline actions when back online
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_TRIGGERED',
            tag: event.tag
          });
        });
      })
    );
  }
});

// Handle periodic background sync (for mobile app-like behavior)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag);
  
  if (event.tag === 'background-refresh') {
    event.waitUntil(
      // Refresh data periodically
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PERIODIC_SYNC',
            tag: event.tag
          });
        });
      })
    );
  }
});

// Enhanced message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
          return cache.keys();
        }).then(keys => {
          event.ports[0].postMessage({
            cacheSize: keys.length,
            cacheName: CACHE_NAME,
            cachedUrls: keys.map(req => req.url)
          });
        })
      );
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

// Error handling for uncaught errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled promise rejection:', event.reason);
});

console.log('Enhanced Service Worker loaded successfully');