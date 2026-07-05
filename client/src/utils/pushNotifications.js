function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push not supported");
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    console.log("Service worker registered");
    return reg;
  } catch (err) {
    console.error("SW registration failed:", err);
    return null;
  }
}

export async function subscribeToPush(axiosInstance) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await axiosInstance.post("/api/push/subscribe", {
        subscription: existing.toJSON(),
      });
      return existing;
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const convertedKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    await axiosInstance.post("/api/push/subscribe", {
      subscription: subscription.toJSON(),
    });

    console.log("Push subscribed successfully");
    return subscription;
  } catch (err) {
    console.error("Push subscribe failed:", err);
  }
}

export async function unsubscribeFromPush(axiosInstance) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await axiosInstance.post("/api/push/unsubscribe", {
        endpoint: subscription.endpoint,
      });
      await subscription.unsubscribe();
      console.log("Unsubscribed from push");
    }
  } catch (err) {
    console.error("Unsubscribe failed:", err);
  }
}