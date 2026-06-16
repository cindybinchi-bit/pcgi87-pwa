import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, onSnapshot } from 'firebase/firestore';
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
