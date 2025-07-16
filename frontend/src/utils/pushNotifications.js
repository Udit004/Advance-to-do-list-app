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

// Enhanced mobile detection
export function isMobileDevice() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.screen.width <= 768;
  
  return isMobile || (isTouch && isSmallScreen);
}

// Check if browser supports native-like notifications
export function supportsNativeNotifications() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isChrome = /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent);
  const isFirefox = /Firefox/i.test(navigator.userAgent);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
  
  // Android Chrome and Firefox support native-like notifications
  if (isAndroid && (isChrome || isFirefox)) return true;
  
  // iOS Safari 16.4+ supports notifications
  if (isSafari && navigator.userAgent.includes('Version/')) {
    const version = navigator.userAgent.match(/Version\/(\d+)/);
    if (version && parseInt(version[1]) >= 16) return true;
  }
  
  return false;
}

// Register service worker with mobile-specific optimizations
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported on this device");
  }

  try {
    // Unregister any existing service workers first (mobile fix)
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      if (registration.scope.includes('sw.js') || registration.scope.includes('service-worker.js')) {
        await registration.unregister();
      }
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });

    // Enhanced mobile waiting logic
    if (isMobileDevice()) {
      // Wait for service worker to be installing or active
      if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', () => {
            if (registration.installing.state === 'activated') {
              resolve();
            }
          });
        });
      }
      
      // Additional wait for mobile browsers
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    await navigator.serviceWorker.ready;
    console.log("✅ Service Worker registered successfully");
    
    // Verify service worker is actually active
    const readyRegistration = await navigator.serviceWorker.ready;
    if (!readyRegistration.active) {
      throw new Error('Service worker not active after registration');
    }
    
    return readyRegistration;
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
    // Show different messages for different platforms
    if (isMobileDevice()) {
      console.warn("Notifications are blocked. Please enable them in your browser settings.");
      // For mobile, show user-friendly instructions
      showMobileNotificationInstructions();
    }
    return false;
  }

  try {
    // For mobile devices, ensure user gesture is fresh
    if (isMobileDevice()) {
      // Add a small delay to ensure user gesture is still active
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Request permission
    permission = await Notification.requestPermission();
    
    console.log(`Permission result: ${permission}`);
    
    if (permission === "granted") {
      // Show success feedback
      showNotificationSuccessMessage();
      return true;
    } else {
      // Show instructions for enabling notifications
      if (isMobileDevice()) {
        showMobileNotificationInstructions();
      }
      return false;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

// Show mobile-specific notification instructions
function showMobileNotificationInstructions() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  let message = "To enable notifications:\n";
  
  if (isAndroid) {
    message += "• Tap the 🔒 or ⓘ icon in the address bar\n";
    message += "• Select 'Notifications' and choose 'Allow'";
  } else if (isIOS) {
    message += "• Go to Settings > Safari > Notifications\n";
    message += "• Allow notifications for this site";
  } else {
    message += "• Check your browser's notification settings\n";
    message += "• Allow notifications for this site";
  }
  
  // You can replace this with a proper UI notification
  console.info(message);
}

// Show success message
function showNotificationSuccessMessage() {
  console.log("✅ Notifications enabled successfully!");
  // You can replace this with a proper UI notification
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
    console.log('Starting push subscription for mobile device...');
    
    // Step 1: Register service worker and wait for it to be ready
    const registration = await registerServiceWorker();
    
    // Step 2: Request permission BEFORE subscribing (important for mobile)
    const permissionGranted = await askNotificationPermission();
    if (!permissionGranted) {
      console.error('Notification permission not granted');
      return false;
    }

    // Step 3: Enhanced wait for mobile devices
    if (isMobileDevice()) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Step 4: Check if service worker is active
    if (!registration.active) {
      console.error('Service worker is not active');
      return false;
    }

    // Step 5: Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Existing subscription found, unsubscribing first...');
      await subscription.unsubscribe();
    }

    // Create new subscription with mobile-optimized options
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      
      console.log('✅ Push subscription created successfully');
    } catch (subscribeError) {
      console.error('Failed to subscribe:', subscribeError);
      
      // For mobile, try with retry logic
      if (isMobileDevice()) {
        console.log('Retrying subscription for mobile...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
          console.log('✅ Push subscription created on retry');
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          return false;
        }
      } else {
        return false;
      }
    }

    // Step 6: Send to backend with enhanced mobile device info
    const deviceInfo = {
      isMobile: isMobileDevice(),
      supportsNative: supportsNativeNotifications(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        orientation: window.screen.orientation?.type || 'unknown'
      },
      timestamp: Date.now()
    };

    const response = await API.post('/push/subscribe', {
      subscription: subscription.toJSON(),
      userId,
      deviceInfo
    });

    if (response.data.success) {
      console.log('✅ Push subscription sent to backend successfully');
      
      // Test notification immediately on mobile
      if (isMobileDevice()) {
        setTimeout(() => {
          testNotification();
        }, 1000);
      }
      
      return true;
    } else {
      console.error('❌ Failed to save subscription to backend');
      return false;
    }

  } catch (error) {
    console.error('❌ Push subscription error:', error);
    return false;
  }
}

// Enhanced test notification function
async function testNotification() {
  try {
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      
      // Mobile-optimized notification options
      const notificationOptions = {
        body: 'Push notifications are now enabled! 🎉',
        icon: '/zenList-192.png',
        badge: '/zenList-192.png',
        tag: 'test-notification',
        vibrate: [200, 100, 200, 100, 200], // Enhanced vibration for mobile
        silent: false,
        requireInteraction: isMobileDevice(), // Keep visible on mobile
        data: {
          timestamp: Date.now(),
          url: '/',
          type: 'test'
        },
        actions: isMobileDevice() ? [
          {
            action: 'open',
            title: 'Open App',
            icon: '/zenList-192.png'
          }
        ] : []
      };

      await registration.showNotification('ZenList - Test Notification', notificationOptions);
      console.log('✅ Test notification shown');
    }
  } catch (error) {
    console.error('❌ Test notification failed:', error);
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
        supportsNative: supportsNativeNotifications(),
        browserInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        }
      };
    }
    
    return {
      isSubscribed: false,
      hasPermission: false,
      subscription: null,
      isSupported: false,
      isMobile: isMobileDevice(),
      supportsNative: false
    };
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return {
      isSubscribed: false,
      hasPermission: false,
      subscription: null,
      isSupported: false,
      isMobile: isMobileDevice(),
      supportsNative: false,
      error: error.message
    };
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

// Enhanced initialization with mobile-specific retry logic
export async function initializePushNotifications(userId, maxRetries = 3) {
  let retryCount = 0;
  const retryDelay = isMobileDevice() ? 4000 : 2000;
  
  console.log(`🚀 Initializing push notifications for ${isMobileDevice() ? 'mobile' : 'desktop'} device`);
  
  // Check if notifications are supported
  if (!isPushNotificationSupported()) {
    console.error('❌ Push notifications are not supported on this device');
    return false;
  }

  // Check if browser supports native-like notifications
  if (isMobileDevice() && !supportsNativeNotifications()) {
    console.warn('⚠️ This browser may not support native-like notifications');
  }
  
  while (retryCount < maxRetries) {
    try {
      const success = await subscribeUserToPush(userId);
      if (success) {
        console.log('✅ Push notifications initialized successfully');
        
        // Set up event listeners for mobile
        if (isMobileDevice()) {
          setupMobileEventListeners();
        }
        
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

// Set up mobile-specific event listeners
function setupMobileEventListeners() {
  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 App became visible, checking subscription status...');
      checkSubscriptionStatus().then(status => {
        console.log('Current subscription status:', status);
      });
    }
  });

  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('📶 Device came online');
    // Recheck subscription when back online
    checkSubscriptionStatus();
  });

  window.addEventListener('offline', () => {
    console.log('📴 Device went offline');
  });

  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    console.log('🔄 Orientation changed');
    // Small delay to ensure proper handling
    setTimeout(() => {
      checkSubscriptionStatus();
    }, 500);
  });
}

// Test function to manually trigger a notification
export async function sendTestNotification() {
  try {
    const status = await checkSubscriptionStatus();
    
    if (!status.isSubscribed) {
      console.error('❌ User is not subscribed to push notifications');
      return false;
    }

    // Send test notification request to backend
    const response = await API.post('/push/test', {
      message: 'This is a test notification from ZenList! 🎉',
      title: 'ZenList Test',
      icon: '/zenList-192.png',
      badge: '/zenList-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/',
        type: 'test',
        timestamp: Date.now()
      }
    });

    if (response.data.success) {
      console.log('✅ Test notification sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send test notification');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    return false;
  }
}

// Utility function to handle install prompt for PWA
export function handleInstallPrompt() {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 PWA install prompt available');
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

// Export everything for easy usage
export default {
  isPushNotificationSupported,
  isMobileDevice,
  supportsNativeNotifications,
  registerServiceWorker,
  askNotificationPermission,
  subscribeUserToPush,
  unsubscribeFromPush,
  checkSubscriptionStatus,
  initializePushNotifications,
  sendTestNotification,
  handleInstallPrompt
};