// src/lib/firebase-client.ts
// Firebase client initialisation — runs in the browser only.
// Requests notification permission, gets FCM token, saves it to Neon via API.
// Called once from the layout when user is logged in.

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialise once — Next.js hot reload can call this multiple times
function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

// Request permission and get FCM token
// Returns the token or null if permission denied or browser unsupported
export async function initialiseFCM(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;

    const isIOS = /iPhone|iPad/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isStandalone) return null;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // Register service worker first — must exist before getToken is called
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );

    // Wait for the service worker to be active
    await new Promise<void>((resolve) => {
      if (registration.active) { resolve(); return; }
      const sw = registration.installing ?? registration.waiting;
      if (!sw) { resolve(); return; }
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated") resolve();
      });
    });

    const app       = getFirebaseApp();
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey:                  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (err) {
    console.error("[FCM] Token error:", err);
    return null;
  }
}

// Listen for foreground messages and show a toast
// Call this once after initialisation
export function listenForForegroundMessages(
  onNotification: (title: string, body: string, link: string) => void
) {
  try {
    const app       = getFirebaseApp();
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? "CorperNest";
      const body  = payload.notification?.body  ?? payload.data?.body  ?? "";
      const link  = payload.data?.link ?? "/";
      onNotification(title, body, link);
    });
  } catch { return () => {}; }
}