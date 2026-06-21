import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
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
  // Connexion anonyme pour les lectures/écritures
  return signInAnonymously(auth);
}

// Bénéficiaires
export async function addBeneficiary(structureId, beneficiary) {
  return addDoc(collection(db, 'structures', structureId, 'beneficiaires'), {
    ...beneficiary,
    createdAt: new Date().toISOString(),
  });
}

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

export async function updateBeneficiary(structureId, beneficiaryId, data) {
  return updateDoc(doc(db, 'structures', structureId, 'beneficiaires', beneficiaryId), data);
}

export async function deleteBeneficiary(structureId, beneficiaryId) {
  return deleteDoc(doc(db, 'structures', structureId, 'beneficiaires', beneficiaryId));
}

// Activités
export async function addActivity(structureId, activity) {
  return addDoc(collection(db, 'structures', structureId, 'activities'), {
    ...activity,
    createdAt: new Date().toISOString(),
  });
}

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

export async function updateActivity(structureId, activityId, data) {
  return updateDoc(doc(db, 'structures', structureId, 'activities', activityId), data);
}

export async function deleteActivity(structureId, activityId) {
  return deleteDoc(doc(db, 'structures', structureId, 'activities', activityId));
}

// Agendas
export async function addAgendaEvent(structureId, event) {
  return addDoc(collection(db, 'structures', structureId, 'agendas'), {
    ...event,
    createdAt: new Date().toISOString(),
  });
}

export function onAgendaChange(structureId, callback) {
  return onSnapshot(collection(db, 'structures', structureId, 'agendas'), (snapshot) => {
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(events);
  });
}

export async function deleteAgendaEvent(structureId, eventId) {
  return deleteDoc(doc(db, 'structures', structureId, 'agendas', eventId));
}

export { db, auth };
