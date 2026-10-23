// Ancien service de notifications (désactivé pour protéger la vie privée).
// Ce fichier supprime l'ancienne installation sur les téléphones qui l'avaient.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.unregister());
});
