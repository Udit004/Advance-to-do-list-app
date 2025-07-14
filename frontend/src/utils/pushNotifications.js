// pushNotifications.js - Simplified version
import API from '../api/config';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Register service worker with proper error handling
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported");
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    console.log("✅ Service Worker registered successfully");
    return registration;
  } catch (error) {
    console.error("❌ Service Worker registration failed:", error);
    throw error;
  }
}

// Ask for notification permission
export async function askNotificationPermission() {
  if (!("Notification" in window)) {
    console.error("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

// Subscribe to push notifications
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
    
    // Step 2: Wait a bit for service worker to be fully active
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // Step 6: Send to backend
    const response = await API.post('/push/subscribe', {
      subscription: subscription.toJSON(),
      userId
    });

    if (response.data.success) {
      console.log('✅ Push subscription successful');
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

// Unsubscribe from push notifications
export async function unsubscribeFromPush(userId) {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        if (userId) {
          await API.post('/push/unsubscribe', {
            userId,
            endpoint: subscription.endpoint
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

// Check subscription status
export async function checkSubscriptionStatus() {
  try {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      return {
        isSubscribed: !!subscription,
        hasPermission: Notification.permission === 'granted',
        subscription: subscription ? subscription.toJSON() : null
      };
    }
    
    return {
      isSubscribed: false,
      hasPermission: false,
      subscription: null
    };
  } catch (error) {
    console.error('❌ Error checking subscription status:', error);
    return {
      isSubscribed: false,
      hasPermission: false,
      subscription: null
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

// Initialize push notifications with retry
export async function initializePushNotifications(userId, maxRetries = 2) {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const success = await subscribeUserToPush(userId);
      if (success) {
        console.log('✅ Push notifications initialized');
        return true;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`🔄 Retry ${retryCount}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.error('❌ Failed to initialize push notifications');
  return false;
}