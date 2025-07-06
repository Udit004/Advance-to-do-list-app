// src/hooks/usePushNotifications.js
export async function registerPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log("✅ Service Worker registered");

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('🚫 Notification permission not granted');
        return;
      }

      const response = await fetch('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: '<YOUR_PUBLIC_VAPID_KEY>'
          })
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('📩 Subscription sent to backend:', await response.json());
    } catch (err) {
      console.error('❌ Error in push setup:', err);
    }
  } else {
    console.error('🙅 Push notifications are not supported in this browser.');
  }
}
