import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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

export { db, auth };
