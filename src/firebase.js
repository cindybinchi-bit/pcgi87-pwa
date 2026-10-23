/**
 * Connexion à Firebase — version sécurisée.
 * Plus de connexion anonyme : la personne est identifiée par un jeton
 * délivré par le serveur après vérification de son nom et de son code.
 */
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithCustomToken,
  signOut,
  onIdTokenChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyDBEvh1e3M7XwfgMxFIEO0PcZydC8kliSg',
  authDomain: 'pcgi87.firebaseapp.com',
  projectId: 'pcgi87',
  storageBucket: 'pcgi87.firebasestorage.app',
  messagingSenderId: '242979251003',
  appId: '1:242979251003:web:62b4991835d5ef3e018d1e',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Pas de « popup / redirection » : aucune fenêtre tierce n'est chargée.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
});
export const db = getFirestore(app);
const functions = getFunctions(app, 'europe-west3');

/** Messages d'erreur compréhensibles pour les bénéficiaires. */
export function messageErreur(err, defaut = 'Une erreur est survenue. Réessayez dans un instant.') {
  const code = String(err?.code || '');
  if (code.includes('unavailable') || code.includes('network') || code.includes('deadline')) {
    return 'Pas de connexion internet. Vérifiez votre réseau et réessayez.';
  }
  if (code.startsWith('functions/') && err?.message && !code.includes('internal')) return err.message;
  return defaut;
}

async function appeler(nom, donnees) {
  const res = await httpsCallable(functions, nom)(donnees);
  return res.data;
}

export function listeStructures() {
  return appeler('listeStructures', {});
}

export async function seConnecter({ structureId, nomComplet, code, resterConnecte }) {
  const res = await appeler('connexionBeneficiaire', { structureId, nomComplet, code });
  await setPersistence(auth, resterConnecte ? indexedDBLocalPersistence : browserSessionPersistence);
  await signInWithCustomToken(auth, res.token);
  return res;
}

export async function changerCode(nouveauCode) {
  const res = await appeler('changerCodeBeneficiaire', { nouveauCode });
  await signInWithCustomToken(auth, res.token);
  await auth.currentUser?.getIdToken(true);
  return res;
}

export function demanderNouveauCode(structureId, nomComplet) {
  return appeler('demanderNouveauCode', { structureId, nomComplet });
}

export function seDeconnecter() {
  return signOut(auth);
}

/**
 * Suit la session : renvoie { structureId, benId, codeProvisoire } ou null.
 * Toute session qui n'est pas celle d'un bénéficiaire (ex. ancienne
 * connexion anonyme) est fermée.
 */
export function suivreSession(callback) {
  // onIdTokenChanged : réagit aussi au nouveau jeton reçu après le choix du code.
  return onIdTokenChanged(auth, async (user) => {
    if (!user) { callback(null); return; }
    try {
      const { claims } = await user.getIdTokenResult();
      if (claims.type !== 'beneficiaire' || !claims.benId || !claims.structureId) {
        await signOut(auth);
        callback(null);
        return;
      }
      callback({
        uid: user.uid,
        structureId: claims.structureId,
        benId: claims.benId,
        codeProvisoire: claims.codeProvisoire === true,
      });
    } catch {
      callback(null);
    }
  });
}
