const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    return await navigator.serviceWorker.register("/sw.js");
  } else {
    throw new Error("Service workers are not supported in this browser");
  }
}

export async function askNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function subscribeUserToPush() {
  const registration = await registerServiceWorker();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });

  // Send to your backend
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.ok;
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}
