// public/firebase-messaging-sw.js
// Service worker for Firebase Cloud Messaging background push notifications.
// Must be at public root — Firebase requires this exact filename and location.
// Handles notifications when the app is closed or in the background.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyD5Q32IwujHerSFw0aJWupzZAPwn-sTqe8",
  authDomain:        "corpernest-313ee.firebaseapp.com",
  projectId:         "corpernest-313ee",
  messagingSenderId: "1071055471889",
  appId:             "1:1071055471889:web:82e6d942b923cb6ed678b0",
});

const messaging = firebase.messaging();

// Handle background messages — show notification when app is not in focus
messaging.onBackgroundMessage((payload) => {
  const { title, body, link } = payload.notification ?? payload.data ?? {};

  self.registration.showNotification(title ?? "CorperNest", {
    body:  body  ?? "",
    icon:  "/icon-192.png",
    badge: "/badge-72.png",
    data:  { link: link ?? "/" },
  });
});

// Open the app when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});