import API from '../api/config';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered successfully:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  } else {
    throw new Error("Service workers are not supported in this browser");
  }
}

export async function askNotificationPermission() {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

export async function subscribeUserToPush(userId) {
  if (!userId) {
    console.error('Push subscription error: userId is missing or undefined');
    return false;
  }

  if (!publicVapidKey) {
    console.error('VAPID public key is missing');
    return false;
  }

  try {
    const registration = await registerServiceWorker();
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      // Still send to backend to ensure it's saved with userId
      await API.post('/push/subscribe', { subscription: existingSubscription, userId });
      return true;
    }

    // Create new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    // Send to backend
    await API.post('/push/subscribe', { subscription, userId });
    console.log('Push subscription created and saved successfully');
    return true;
  } catch (error) {
    console.error('Push subscription error:', error);
    return false;
  }
}

export async function unsubscribeFromPush() {
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}