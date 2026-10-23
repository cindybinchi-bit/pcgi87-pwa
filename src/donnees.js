/**
 * Lecture / écriture des données du bénéficiaire connecté.
 * Chaque requête est limitée à SES données (exigé par les règles Firestore).
 */
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

/** Doit rester identique au calcul de l'application bureau. */
export function idConversation(benId) {
  return `benef_conversation_${benId}`;
}

function iso(v) {
  return v?.toDate?.()?.toISOString?.() || (typeof v === 'string' ? v : null);
}

export function suivreFiche(structureId, benId, callback, surErreur) {
  return onSnapshot(
    doc(db, 'structures', structureId, 'beneficiaires', benId),
    (snap) => callback(snap.exists() ? { ...snap.data(), id: snap.id } : null),
    surErreur,
  );
}

/** Rendez-vous directs + prestations auxquelles la personne est inscrite. */
export function suivreAgenda(structureId, benId, callback, surErreur) {
  const ref = collection(db, 'structures', structureId, 'agendas');
  let directs = [];
  let affilies = [];
  const publier = () => {
    const parId = new Map();
    [...directs, ...affilies].forEach((e) => parId.set(e.id, e));
    callback([...parId.values()]);
  };
  const lire = (snap) => snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  const u1 = onSnapshot(query(ref, where('beneficiaryId', '==', benId)), (s) => { directs = lire(s); publier(); }, surErreur);
  const u2 = onSnapshot(query(ref, where('beneficiairesAffilies', 'array-contains', benId)), (s) => { affilies = lire(s); publier(); }, surErreur);
  return () => { u1(); u2(); };
}

export function suivreMessages(benId, callback, surErreur) {
  const ref = query(collection(db, 'conversations', idConversation(benId), 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(ref, (snap) => {
    callback(snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: iso(data.createdAt) || new Date().toISOString(),
        readAt: iso(data.readAt),
      };
    }));
  }, surErreur);
}

export async function envoyerMessage(fiche, structureId, contenu) {
  const convId = idConversation(fiche.id);
  const nom = `${fiche.prenom || ''} ${fiche.nom || ''}`.trim();
  await addDoc(collection(db, 'conversations', convId, 'messages'), {
    authorType: 'beneficiary',
    authorId: fiche.id,
    authorName: nom,
    content: contenu.slice(0, 5000),
    scope: 'beneficiary',
    createdAt: serverTimestamp(),
    readAt: null,
  });
  await setDoc(doc(db, 'conversations', convId), {
    beneficiaryId: fiche.id,
    beneficiaryName: nom,
    beneficiaryEmail: fiche.email || '',
    structureId,
    scope: 'beneficiary',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Accusé de lecture des messages du référent. */
export async function marquerCommeLus(benId) {
  const convId = idConversation(benId);
  const snap = await getDocs(query(
    collection(db, 'conversations', convId, 'messages'),
    where('authorType', '==', 'professional'),
  ));
  await Promise.all(snap.docs
    .filter((d) => !d.data().readAt)
    .map((d) => updateDoc(d.ref, { readAt: serverTimestamp() })));
}
