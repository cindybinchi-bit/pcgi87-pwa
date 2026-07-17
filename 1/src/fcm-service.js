import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDBEvh1e3M7XwfgMxFIEO0PcZydC8kliSg",
  authDomain: "pcgi87.firebaseapp.com",
  projectId: "pcgi87",
  storageBucket: "pcgi87.firebasestorage.app",
  messagingSenderId: "242979251003",
  appId: "1:242979251003:web:62b4991835d5ef3e018d1e",
  measurementId: "G-YT3000GR76"
};

let messaging;

export async function initFCM() {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);

  // Enregistrer le Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker FCM enregistré');
    } catch (error) {
      console.error('❌ Erreur Service Worker:', error);
    }
  }

  // Demander la permission pour les notifications
  return requestNotificationPermission();
}

export async function requestNotificationPermission() {
  try {
    // Demander la permission au navigateur
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('✅ Permissions de notification accordées');

      // Obtenir le token FCM
      try {
        const token = await getToken(messaging, {
          vapidKey: 'BCEwphB8JqJ2eKEDL5FKEVhL5Fz_XXzDVqYm8eXH-qYWjMPl6LSLZOj3zRFv1L9-nLLmK_L5cQBkEwL4VzL5'
        });

        if (token) {
          console.log('✅ Token FCM obtenu:', token.substring(0, 20) + '...');
          // Sauvegarder le token
          saveFCMToken(token);
          return token;
        }
      } catch (error) {
        console.error('❌ Erreur obtention token FCM:', error);
      }
    } else {
      console.warn('⚠️ Notifications refusées par l\'utilisateur');
    }
  } catch (error) {
    console.error('❌ Erreur permission:', error);
  }

  return null;
}

export function saveFCMToken(token) {
  // Sauvegarder le token dans localStorage
  const tokens = JSON.parse(localStorage.getItem('fcm_tokens') || '{}');
  const session = JSON.parse(localStorage.getItem('pcgi87.benefSession.v1') || '{}');

  if (session.benId) {
    tokens[session.benId] = token;
    localStorage.setItem('fcm_tokens', JSON.stringify(tokens));
    console.log(`✅ Token sauvegardé pour ${session.benId}`);
  }
}

export function onFCMMessage(callback) {
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log('📬 Message FCM reçu:', payload);
      if (callback) {
        callback(payload);
      }
    });
  }
}

export async function getFCMToken() {
  const session = JSON.parse(localStorage.getItem('pcgi87.benefSession.v1') || '{}');
  const tokens = JSON.parse(localStorage.getItem('fcm_tokens') || '{}');

  return tokens[session.benId] || null;
}
