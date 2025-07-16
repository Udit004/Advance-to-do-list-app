// Enhanced sw.js - Mobile-optimized Service Worker for ZenList
const CACHE_NAME = 'zenlist-v2.1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/zenList-192.png',
  '/zenList-512.png',
  '/offline.html'
];

// Mobile-specific constants
const MOBILE_NOTIFICATION_DEFAULTS = {
  vibrate: [200, 100, 200, 100, 200],
  requireInteraction: true,
  silent: false,
  renotify: true,
  sticky: true
};

// Enhanced install event with mobile optimizations
self.addEventListener('install', (event) => {
  console.log('📱 Service Worker installing for mobile...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Opened cache');
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`⚠️ Failed to cache ${url}:`, error);
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log('✅ Cache populated, skipping waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Enhanced activate event with mobile cleanup
self.addEventListener('activate', (event) => {
  console.log('📱 Service Worker activating for mobile...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated and claimed all clients');
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
    // API requests - mobile-optimized network first
    event.respondWith(
      fetch(request, {
        // Mobile-specific fetch options
        cache: 'no-cache',
        mode: 'cors',
        credentials: 'same-origin'
      }).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'offline', 
            message: 'You are currently offline. Please check your connection.',
            timestamp: Date.now()
          }),
          {
            status: 503,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
      })
    );
  } else {
    // Static assets and pages - mobile-optimized caching
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            // For mobile, also try to update cache in background
            if (shouldUpdateInBackground(request)) {
              updateCacheInBackground(request);
            }
            return response;
          }
          
          // Otherwise, fetch from network with mobile optimizations
          return fetch(request, {
            cache: 'default',
            mode: 'cors'
          }).then((response) => {
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
          // Enhanced offline handling for mobile
          if (request.destination === 'document') {
            return caches.match('/offline.html') || 
                   caches.match('/') || 
                   createOfflineResponse();
          }
          
          // For images, return a placeholder
          if (request.destination === 'image') {
            return createOfflineImageResponse();
          }
          
          // For other requests, return appropriate offline response
          return new Response('Offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
  }
});

// Helper function to determine if cache should be updated in background
function shouldUpdateInBackground(request) {
  const url = new URL(request.url);
  
  // Update HTML files more frequently on mobile
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    return true;
  }
  
  // Update manifest and service worker
  if (url.pathname.includes('manifest.json') || url.pathname.includes('sw.js')) {
    return true;
  }
  
  return false;
}

// Update cache in background
function updateCacheInBackground(request) {
  fetch(request).then(response => {
    if (response && response.status === 200) {
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, response.clone());
      });
    }
  }).catch(error => {
    console.warn('Background update failed:', error);
  });
}

// Create offline response for documents
function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ZenList - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .offline-message { color: #666; }
        .retry-button { 
          background: #1976d2; 
          color: white; 
          padding: 10px 20px; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer; 
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>ZenList</h1>
      <div class="offline-message">
        <p>You're currently offline</p>
        <p>Please check your internet connection and try again</p>
        <button class="retry-button" onclick="window.location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Create offline image response
function createOfflineImageResponse() {
  // Return a simple 1x1 transparent PNG
  const transparentPng = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);
  
  return new Response(transparentPng, {
    headers: { 'Content-Type': 'image/png' }
  });
}

// Enhanced push event with mobile-specific optimizations
self.addEventListener('push', (event) => {
  console.log('📱 Push event received on mobile:', event);

  // Mobile-optimized notification data
  let notificationData = {
    title: 'ZenList',
    body: 'You have a new task notification',
    icon: '/zenList-192.png',
    badge: '/zenList-192.png',
    tag: 'zenlist-notification',
    ...MOBILE_NOTIFICATION_DEFAULTS,
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
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        // Ensure mobile-specific properties are maintained
        vibrate: pushData.vibrate || MOBILE_NOTIFICATION_DEFAULTS.vibrate,
        requireInteraction: pushData.requireInteraction !== undefined ? 
                           pushData.requireInteraction : 
                           MOBILE_NOTIFICATION_DEFAULTS.requireInteraction,
        data: {
          ...notificationData.data,
          ...pushData.data,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
    }
  }

  // Show notification with mobile optimizations
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('✅ Mobile notification shown successfully');
        
        // Send analytics or logging data to all clients
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_SHOWN',
              data: notificationData,
              isMobile: true
            });
          });
        });
      })
      .catch(error => {
        console.error('❌ Failed to show mobile notification:', error);
        
        // Fallback: try to show a simpler notification
        return self.registration.showNotification(notificationData.title, {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag,
          data: notificationData.data
        });
      })
  );
});

// Enhanced notification click handler for mobile
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Mobile notification clicked:', event);
  
  const { notification, action } = event;
  
  // Close the notification
  notification.close();
  
  // Handle different actions
  if (action === 'dismiss') {
    // Send dismiss event to clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_DISMISSED',
          data: notification.data
        });
      });
    });
    return;
  }
  
  // Default action or 'open' action
  const clickUrl = notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clients) => {
      // On mobile, prefer to focus existing window
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(() => {
            // Navigate to the specific URL if different
            if (clickUrl !== '/' && !client.url.includes(clickUrl)) {
              client.navigate(clickUrl);
            }
            
            // Send message to client about notification click
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notification.data,
              action: action,
              isMobile: true
            });
          });
        }
      }
      
      // Open new window if no existing one (mobile browsers may limit this)
      return self.clients.openWindow(clickUrl).then(client => {
        if (client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: notification.data,
            action: action,
            isMobile: true
          });
        }
      });
    })
  );
});

// Enhanced background sync for mobile offline actions
self.addEventListener('sync', (event) => {
  console.log('📱 Mobile background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline actions when back online
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_TRIGGERED',
            tag: event.tag,
            isMobile: true
          });
        });
      })
    );
  }
  
  // Handle task-specific sync events
  if (event.tag.startsWith('task-')) {
    event.waitUntil(
      syncTaskData(event.tag)
    );
  }
});

// Sync task data function
async function syncTaskData(tag) {
  try {
    // Extract task ID from tag
    const taskId = tag.replace('task-', '');
    
    // Get stored sync data
    const cache = await caches.open(CACHE_NAME);
    const syncData = await cache.match(`/sync/${taskId}`);
    
    if (syncData) {
      const data = await syncData.json();
      
      // Send sync request to server
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // Remove from sync cache
        await cache.delete(`/sync/${taskId}`);
        console.log(`✅ Synced task ${taskId} successfully`);
      }
    }
  } catch (error) {
    console.error('❌ Task sync failed:', error);
  }
}

// Handle periodic background sync (mobile PWA feature)
self.addEventListener('periodicsync', (event) => {
  console.log('📱 Mobile periodic sync triggered:', event.tag);
  
  if (event.tag === 'background-refresh') {
    event.waitUntil(
      // Refresh data periodically for mobile
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PERIODIC_SYNC',
            tag: event.tag,
            isMobile: true,
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

// Enhanced message handling for mobile communication
self.addEventListener('message', (event) => {
  console.log('📱 Mobile Service Worker received message:', event.data);
  
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
            cachedUrls: keys.map(req => req.url),
            isMobile: true
          });
        })
      );
      break;
      
    case 'STORE_SYNC_DATA':
      // Store data for background sync
      event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
          return cache.put(
            `/sync/${data.id}`,
            new Response(JSON.stringify(data), {
              headers: { 'Content-Type': 'application/json' }
            })
          );
        }).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
      
    case 'REGISTER_BACKGROUND_SYNC':
      // Register background sync for mobile
      event.waitUntil(
        self.registration.sync.register(data.tag || 'background-sync')
          .then(() => {
            event.ports[0].postMessage({ success: true });
          })
          .catch(error => {
            console.error('❌ Background sync registration failed:', error);
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;
      
    case 'TEST_NOTIFICATION':
      // Test notification for mobile debugging
      event.waitUntil(
        self.registration.showNotification('ZenList Test', {
          body: 'This is a test notification for mobile debugging',
          icon: '/zenList-192.png',
          badge: '/zenList-192.png',
          tag: 'test-mobile',
          ...MOBILE_NOTIFICATION_DEFAULTS,
          data: {
            timestamp: Date.now(),
            url: '/',
            type: 'test'
          }
        }).then(() => {
          event.ports[0].postMessage({ success: true });
        }).catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        })
      );
      break;
      
    default:
      console.warn('⚠️ Unknown message type:', type);
  }
});

// Enhanced error handling for mobile
self.addEventListener('error', (event) => {
  console.error('📱 Mobile Service Worker error:', event.error);
  
  // Send error to clients for debugging
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SERVICE_WORKER_ERROR',
        error: {
          message: event.error.message,
          stack: event.error.stack,
          timestamp: Date.now()
        },
        isMobile: true
      });
    });
  });
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('📱 Mobile Service Worker unhandled promise rejection:', event.reason);
  
  // Send error to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SERVICE_WORKER_UNHANDLED_REJECTION',
        error: {
          reason: event.reason,
          timestamp: Date.now()
        },
        isMobile: true
      });
    });
  });
});

// Mobile-specific notification permission check
self.addEventListener('notificationpermissionchange', (event) => {
  console.log('📱 Mobile notification permission changed:', Notification.permission);
  
  // Notify all clients about permission change
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_PERMISSION_CHANGED',
        permission: Notification.permission,
        isMobile: true,
        timestamp: Date.now()
      });
    });
  });
});

// Handle app installation events
self.addEventListener('appinstalled', (event) => {
  console.log('📱 ZenList PWA installed on mobile device', event);
  
  // Send installation event to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'APP_INSTALLED',
        timestamp: Date.now(),
        isMobile: true
      });
    });
  });
});

// Handle beforeinstallprompt event
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('📱 Mobile install prompt available', event);
  
  // Send to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'INSTALL_PROMPT_AVAILABLE',
        timestamp: Date.now(),
        isMobile: true
      });
    });
  });
});

console.log('✅ Enhanced Mobile Service Worker for ZenList loaded successfully');