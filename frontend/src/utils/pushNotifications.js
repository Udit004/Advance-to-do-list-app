// Enhanced pushNotifications.js for mobile compatibility
import API from '../api/config';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Check if device supports push notifications
export function isPushNotificationSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    'showNotification' in ServiceWorkerRegistration.prototype
  );
}

// Check if device is mobile
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Register service worker with mobile-specific optimizations
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported on this device");
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // For mobile devices, wait a bit longer for service worker to be fully active
    if (isMobileDevice()) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("✅ Service Worker registered successfully");
    return registration;
  } catch (error) {
    console.error("❌ Service Worker registration failed:", error);
    throw error;
  }
}

// Enhanced permission request with mobile-specific handling
export async function askNotificationPermission() {
  if (!("Notification" in window)) {
    console.error("Notifications not supported");
    return false;
  }

  // Check current permission status
  let permission = Notification.permission;
  
  if (permission === "granted") {
    return true;
  }

  if (permission === "denied") {
    // On mobile, show user-friendly message about enabling notifications in settings
    if (isMobileDevice()) {
      console.warn("Notifications are blocked. Please enable them in your browser settings.");
      return false;
    }
    return false;
  }

  try {
    // Request permission with user gesture (important for mobile)
    permission = await Notification.requestPermission();
    
    // Log the result for debugging
    console.log(`Permission result: ${permission}`);
    
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

// Mobile-optimized subscription function
export async function subscribeUserToPush(userId) {
  if (!userId) {
    console.error('userId is required');
    return false;
  }

  if (!publicVapidKey) {
    console.error('VAPID public key is missing');
    return false;
  }

  try {
    // Step 1: Register service worker and wait for it to be ready
    const registration = await registerServiceWorker();
    
    // Step 2: Enhanced wait for mobile devices
    const waitTime = isMobileDevice() ? 3000 : 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Step 3: Check if service worker is active
    if (!registration.active) {
      console.error('Service worker is not active');
      return false;
    }

    // Step 4: Request permission
    const permissionGranted = await askNotificationPermission();
    if (!permissionGranted) {
      console.error('Notification permission not granted');
      return false;
    }

    // Step 5: Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      } catch (subscribeError) {
        console.error('Failed to subscribe:', subscribeError);
        
        // For mobile, try with a delay and retry
        if (isMobileDevice()) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            return false;
          }
        } else {
          return false;
        }
      }
    }

    // Step 6: Send to backend with mobile device info
    const deviceInfo = {
      isMobile: isMobileDevice(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: Date.now()
    };

    const response = await API.post('/push/subscribe', {
      subscription: subscription.toJSON(),
      userId,
      deviceInfo
    });

    if (response.data.success) {
      console.log('✅ Push subscription successful');
      
      // Test notification on mobile to ensure it works
      if (isMobileDevice()) {
        await testNotification();
      }
      
      return true;
    } else {
      console.error('❌ Failed to save subscription');
      return false;
    }

  } catch (error) {
    console.error('❌ Push subscription error:', error);
    return false;
  }
}

// Test notification function
async function testNotification() {
  try {
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('ZenList', {
        body: 'Push notifications are now enabled!',
        icon: '/zenList-192.png',
        badge: '/zenList-192.png',
        tag: 'test-notification',
        vibrate: [200, 100, 200],
        data: {
          timestamp: Date.now(),
          url: '/'
        }
      });
    }
  } catch (error) {
    console.error('Test notification failed:', error);
  }
}

// Enhanced unsubscribe function
export async function unsubscribeFromPush(userId) {
  try {
    if (isPushNotificationSupported()) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        if (userId) {
          await API.post('/push/unsubscribe', {
            userId,
            endpoint: subscription.endpoint,
            deviceInfo: {
              isMobile: isMobileDevice(),
              userAgent: navigator.userAgent
            }
          });
        }
        
        console.log('✅ Successfully unsubscribed');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ Error unsubscribing:', error);
    return false;
  }
}

// Enhanced subscription status check
export async function checkSubscriptionStatus() {
  try {
    if (isPushNotificationSupported()) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      return {
        isSubscribed: !!subscription,
        hasPermission: Notification.permission === 'granted',
        subscription: subscription ? subscription.toJSON() : null,
        isSupported: true,
        isMobile: isMobileDevice(),
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };
    }
    
    return {
      isSubscribed: false,
      hasPermission: false,
      subscription: null,
      isSupported: false,
      isMobile: isMobileDevice()
    };
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return {
      isSubscribed: false,
      hasPermission: false,
      subscription: null,
      isSupported: false,
      isMobile: isMobileDevice(),
      error: error.message
    };
  }
}

// Helper function to convert VAPID key (unchanged)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

// Enhanced initialization with mobile-specific retry logic
export async function initializePushNotifications(userId, maxRetries = 3) {
  let retryCount = 0;
  const retryDelay = isMobileDevice() ? 3000 : 2000;
  
  console.log(`Initializing push notifications for ${isMobileDevice() ? 'mobile' : 'desktop'} device`);
  
  while (retryCount < maxRetries) {
    try {
      const success = await subscribeUserToPush(userId);
      if (success) {
        console.log('✅ Push notifications initialized successfully');
        return true;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`🔄 Retry ${retryCount}/${maxRetries} in ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    } catch (error) {
      console.error(`❌ Attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('❌ Failed to initialize push notifications after all retries');
  return false;
}

// Utility function to handle page visibility changes (important for mobile)
export function handleVisibilityChange() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Page became visible, good time to check subscription status
      checkSubscriptionStatus().then(status => {
        console.log('Current subscription status:', status);
      });
    }
  });
}

// Add install prompt handling for PWA
export function handleInstallPrompt() {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA install prompt available');
  });
  
  return {
    showInstallPrompt: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User ${outcome} the install prompt`);
        deferredPrompt = null;
        return outcome === 'accepted';
      }
      return false;
    },
    isInstallable: () => !!deferredPrompt
  };
}