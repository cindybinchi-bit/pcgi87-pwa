import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  setDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDBEvh1e3M7XwfgMxFIEO0PcZydC8kliSg",
  authDomain: "pcgi87.firebaseapp.com",
  projectId: "pcgi87",
  storageBucket: "pcgi87.firebasestorage.app",
  messagingSenderId: "242979251003",
  appId: "1:242979251003:web:62b4991835d5ef3e018d1e",
  measurementId: "G-YT3000GR76"
};

let app, db, auth;

export function initFirebase() {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  return signInAnonymously(auth);
}

// Lecture des structures (dynamique, synchronisée avec l'app principale)
export async function getStructures() {
  const snapshot = await getDocs(collection(db, 'structures_meta'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function onStructuresChange(callback) {
  return onSnapshot(collection(db, 'structures_meta'), (snapshot) => {
    const structures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(structures);
  });
}

// Lecture des bénéficiaires
export async function getBeneficiaries(structureId) {
  const snapshot = await getDocs(collection(db, 'structures', structureId, 'beneficiaires'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function onBeneficiariesChange(structureId, callback) {
  return onSnapshot(collection(db, 'structures', structureId, 'beneficiaires'), (snapshot) => {
    const beneficiaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(beneficiaries);
  });
}

/**
 * Met à jour le code d'accès du bénéficiaire et désactive le drapeau
 * "première connexion" une fois le nouveau code défini.
 */
export async function updateBeneficiaryAccessCode(structureId, beneficiaryId, newAccessCode) {
  const ref = doc(db, 'structures', structureId, 'beneficiaires', beneficiaryId);
  await updateDoc(ref, {
    accessCode: newAccessCode,
    firstLogin: false,
  });
}

// Lecture des activités
export async function getActivities(structureId) {
  const snapshot = await getDocs(collection(db, 'structures', structureId, 'activities'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function onActivitiesChange(structureId, callback) {
  return onSnapshot(collection(db, 'structures', structureId, 'activities'), (snapshot) => {
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(activities);
  });
}

// Lecture de l'agenda
export async function getAgendaEvents(structureId) {
  const snapshot = await getDocs(collection(db, 'structures', structureId, 'agendas'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export function onAgendaChange(structureId, callback) {
  return onSnapshot(collection(db, 'structures', structureId, 'agendas'), (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
}

// ─── MESSAGERIE (avec accusé de lecture ✓✓) ────────────────────

/**
 * Retourne TOUS les IDs de conversation de ce bénéficiaire dans Firestore
 * (un bénéficiaire peut avoir plusieurs référents = plusieurs fils).
 * Si aucune conversation n'existe encore, retourne un tableau vide.
 */
export async function getBeneficiaryConversationIds(beneficiaryId) {
  try {
    const ref = collection(db, 'conversations');
    const q = query(ref, where('beneficiaryId', '==', beneficiaryId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({
        id: d.id,
        referentName: d.data().referentName || 'Référent',
        referentEmail: d.data().referentEmail || '',
      }));
    }
  } catch (err) {
    console.warn('Impossible de chercher les conversations existantes:', err);
  }
  return [];
}

/**
 * Envoie un message du bénéficiaire vers son référent.
 */
export async function sendBeneficiaryMessage(conversationId, beneficiary, content) {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    authorType: 'beneficiary',
    authorId: beneficiary.id,
    authorName: `${beneficiary.prenom} ${beneficiary.nom}`.trim(),
    content,
    scope: 'beneficiary',
    createdAt: serverTimestamp(),
    readAt: null,
  });
  await setDoc(doc(db, 'conversations', conversationId), {
    beneficiaryId: beneficiary.id,
    beneficiaryName: `${beneficiary.prenom} ${beneficiary.nom}`.trim(),
    beneficiaryEmail: beneficiary.email || '',
    structureId: beneficiary.structureId,
    scope: 'beneficiary',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Écoute en temps réel les messages d'une conversation bénéficiaire,
 * avec leur statut de lecture (readAt).
 * @returns unsubscribe function
 */
export function onMessagesChange(conversationId, callback) {
  const ref = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(ref, (snap) => {
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      readAt: d.data().readAt?.toDate?.()?.toISOString() || null,
    }));
    callback(list);
  }, (err) => console.error('onMessagesChange :', err));
}

/**
 * Marque comme lus tous les messages envoyés par le professionnel
 * (accusé de lecture ✓✓ visible côté app principale).
 */
export async function markMessagesAsReadByBeneficiary(conversationId) {
  try {
    const ref = collection(db, 'conversations', conversationId, 'messages');
    const q = query(ref, where('authorType', '==', 'professional'));
    const snap = await getDocs(q);
    const updates = snap.docs
      .filter((d) => !d.data().readAt)
      .map((d) => updateDoc(doc(db, 'conversations', conversationId, 'messages', d.id), {
        readAt: serverTimestamp(),
      }));
    await Promise.all(updates);
  } catch (err) {
    console.error('markMessagesAsReadByBeneficiary :', err);
  }
}

export { db, auth };
