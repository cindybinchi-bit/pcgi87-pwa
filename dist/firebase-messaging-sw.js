// Service Worker pour recevoir les notifications Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyDBEvh1e3M7XwfgMxFIEO0PcZydC8kliSg",
  authDomain: "pcgi87.firebaseapp.com",
  projectId: "pcgi87",
  storageBucket: "pcgi87.firebasestorage.app",
  messagingSenderId: "242979251003",
  appId: "1:242979251003:web:62b4991835d5ef3e018d1e",
  measurementId: "G-YT3000GR76"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Traiter les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('Notification reçue en arrière-plan:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/pcgi-logo.jpg',
    badge: payload.notification.badge || '/pcgi-logo.jpg',
    tag: payload.data?.type || 'notification',
    requireInteraction: false,
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Chercher un client existant
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
