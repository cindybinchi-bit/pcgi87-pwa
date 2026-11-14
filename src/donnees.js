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
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as refFichier, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase.js';

/**
 * Les trois messageries du salarié. Chacune est un fil séparé :
 * seuls les destinataires indiqués peuvent le lire.
 */
export const CANAUX = [
  { id: 'cip', court: 'Ma CIP', a: 'à ma CIP', label: 'Ma CIP / référent(e)', aVous: 'à votre référent(e)', secret: 'Lu uniquement par votre référent(e) (CIP).' },
  { id: 'secretariat', court: 'Secrétariat / RH', a: 'au secrétariat / RH', label: 'Secrétariat / RH', aVous: 'au secrétariat / RH', secret: 'Lu uniquement par le secrétariat et les RH de votre structure.' },
  { id: 'encadrant', court: 'Encadrant(e)', a: 'à mon encadrant(e)', label: 'Mon encadrant(e) technique', aVous: 'à votre encadrant(e) technique', secret: 'Lu uniquement par votre encadrant(e) technique.' },
];
export const canalParId = (id) => CANAUX.find((c) => c.id === id) || CANAUX[0];

/** Doit rester identique au calcul de l'application bureau. */
export function idConversation(benId, canal = 'cip', structureId = '') {
  if (canal === 'secretariat') return `benef_secretariat_${structureId}_${benId}`;
  if (canal === 'encadrant') return `benef_encadrant_${structureId}_${benId}`;
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

export function suivreMessages(convId, callback, surErreur) {
  const ref = query(collection(db, 'conversations', convId, 'messages'), orderBy('createdAt', 'asc'));
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

export async function envoyerMessage(fiche, structureId, contenu, pieceJointe = null, canal = 'cip') {
  const convId = idConversation(fiche.id, canal, structureId);
  const nom = `${fiche.prenom || ''} ${fiche.nom || ''}`.trim();
  await addDoc(collection(db, 'conversations', convId, 'messages'), {
    authorType: 'beneficiary',
    authorId: fiche.id,
    authorName: nom,
    content: contenu.slice(0, 5000),
    scope: 'beneficiary',
    createdAt: serverTimestamp(),
    readAt: null,
    ...(pieceJointe ? { attachment: pieceJointe } : {}),
  });
  await setDoc(doc(db, 'conversations', convId), {
    beneficiaryId: fiche.id,
    beneficiaryName: nom,
    beneficiaryEmail: fiche.email || '',
    structureId,
    scope: 'beneficiary',
    updatedAt: serverTimestamp(),
    // Le fil de la CIP garde exactement son ancien format.
    ...(canal !== 'cip' ? { canal } : {}),
  }, { merge: true });
}

/* ── Agenda : ce que le salarié ajoute lui-même ── */

/** Type d'événement utilisé pour un rendez-vous socio-professionnel extérieur. */
export const TYPE_RDV_SOCIOPRO = 'rdv_exterieur';

export const MOTIFS_RDV = [
  { id: 'france_travail', label: 'France Travail' },
  { id: 'mission_locale', label: 'Mission locale' },
  { id: 'social', label: 'Assistant(e) social(e)' },
  { id: 'administratif', label: 'Démarche administrative (CAF, mairie, banque…)' },
  { id: 'logement', label: 'Logement' },
  { id: 'formation', label: 'Formation' },
  { id: 'embauche', label: 'Entretien d\'embauche' },
  { id: 'autre', label: 'Autre rendez-vous' },
];

const nomComplet = (fiche) => `${fiche.prenom || ''} ${fiche.nom || ''}`.trim();

function baseEvenement(fiche, structureId) {
  return {
    beneficiaryId: fiche.id,
    beneficiaryName: nomComplet(fiche),
    structureId,
    scope: 'beneficiary', // indispensable : l'appli bureau filtre sur ce champ
    source: 'beneficiaire', // ajouté par le salarié depuis son téléphone
    createdAt: serverTimestamp(),
    createdBy: nomComplet(fiche),
  };
}

/** Demande de congé payé : visible par la structure, « en attente » jusqu'à sa réponse. */
export function demanderConge(fiche, structureId, { du, au, commentaire }) {
  return addDoc(collection(db, 'structures', structureId, 'agendas'), {
    ...baseEvenement(fiche, structureId),
    type: 'conge',
    title: 'Congé payé (demande)',
    startAt: `${du}T00:00`,
    endAt: `${au || du}T23:59`,
    allDay: true,
    notes: String(commentaire || '').trim().slice(0, 500),
    statut: 'en_attente',
  });
}

/** Rendez-vous socio-professionnel : la CIP en est informée. */
export function ajouterRendezVous(fiche, structureId, { motif, precision, jour, debut, fin, lieu, notes }) {
  const libelle = MOTIFS_RDV.find((m) => m.id === motif)?.label.replace(/\s*\(.*\)$/, '') || 'Rendez-vous';
  const detail = String(precision || '').trim().slice(0, 80);
  return addDoc(collection(db, 'structures', structureId, 'agendas'), {
    ...baseEvenement(fiche, structureId),
    type: TYPE_RDV_SOCIOPRO,
    motif,
    title: motif === 'autre' && detail ? detail : `${libelle}${detail && motif !== 'autre' ? ` — ${detail}` : ''}`,
    startAt: debut ? `${jour}T${debut}` : jour,
    endAt: debut && fin ? `${jour}T${fin}` : (debut ? `${jour}T${debut}` : jour),
    lieu: String(lieu || '').trim().slice(0, 150),
    notes: String(notes || '').trim().slice(0, 500),
  });
}

/** Le salarié retire ce qu'il a ajouté lui-même (demande pas encore traitée, RDV). */
export function retirerEvenement(structureId, id) {
  return deleteDoc(doc(db, 'structures', structureId, 'agendas', id));
}

/* ── Dépôt de documents par le bénéficiaire ── */

export const TAILLE_MAX_DEPOT = 15 * 1024 * 1024; // 15 Mo (identique aux règles Storage)

export const CATEGORIES_DEPOT = [
  { id: 'administratif', label: 'Pièce administrative (identité, carte Vitale…)' },
  { id: 'justificatif', label: 'Justificatif (domicile, ressources, CAF…)' },
  { id: 'cv', label: 'CV / lettre de motivation' },
  { id: 'arret', label: 'Arrêt de travail / absence' },
  { id: 'formation', label: 'Diplôme, attestation, formation' },
  { id: 'autre', label: 'Autre document' },
];

const TYPES_DEPOT = /^(application\/pdf|image\/(jpeg|png|webp|heic|heif)|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.oasis\.opendocument\.text)$/;
export const ACCEPT_DEPOT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.odt,application/pdf,image/*';

function typeDuFichier(f) {
  if (f.type && TYPES_DEPOT.test(f.type)) return f.type;
  const ext = (f.name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
  return {
    pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    heic: 'image/heic', heif: 'image/heif', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    odt: 'application/vnd.oasis.opendocument.text',
  }[ext] || '';
}

/** Renvoie un message d'erreur compréhensible, ou '' si le fichier est accepté. */
export function verifierFichier(f) {
  if (!f) return 'Aucun fichier choisi.';
  if (!typeDuFichier(f)) {
    return 'Ce type de fichier n\'est pas accepté. Envoyez une photo, un PDF ou un document Word.';
  }
  if (f.size > TAILLE_MAX_DEPOT) return 'Ce fichier est trop lourd (15 Mo maximum).';
  if (f.size === 0) return 'Ce fichier est vide.';
  return '';
}

function nomPropre(nom) {
  return String(nom || 'document')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(-80) || 'document';
}

/**
 * Envoie le fichier dans Storage (dossier propre au bénéficiaire),
 * puis l'annonce dans la messagerie choisie (référent par défaut).
 * onProgression(0..100) est appelé pendant l'envoi.
 */
export async function deposerDocument({ fiche, structureId, fichier, categorie, commentaire, onProgression, canal = 'cip' }) {
  const probleme = verifierFichier(fichier);
  if (probleme) throw new Error(probleme);
  const type = typeDuFichier(fichier);
  const chemin = `depots_beneficiaires/${structureId}/${fiche.id}/${Date.now()}_${nomPropre(fichier.name)}`;
  const ref = refFichier(storage, chemin);
  const tache = uploadBytesResumable(ref, fichier, {
    contentType: type,
    customMetadata: { categorie: categorie || 'autre' },
  });
  await new Promise((resolve, reject) => {
    tache.on('state_changed',
      (s) => onProgression?.(Math.round((s.bytesTransferred / Math.max(1, s.totalBytes)) * 100)),
      reject,
      resolve);
  });
  const url = await getDownloadURL(ref);
  const libelle = CATEGORIES_DEPOT.find((c) => c.id === categorie)?.label.replace(/\s*\(.*\)$/, '') || 'Document';
  const note = String(commentaire || '').trim();
  const contenu = `📎 Document envoyé : ${libelle}${note ? `\n${note}` : ''}`;
  await envoyerMessage(fiche, structureId, contenu, {
    name: fichier.name.slice(0, 150),
    url,
    path: chemin,
    type,
    size: fichier.size,
    categorie: categorie || 'autre',
  }, canal);
}

/** Accusé de lecture des messages reçus dans un fil. */
export async function marquerCommeLus(convId) {
  const snap = await getDocs(query(
    collection(db, 'conversations', convId, 'messages'),
    where('authorType', '==', 'professional'),
  ));
  await Promise.all(snap.docs
    .filter((d) => !d.data().readAt)
    .map((d) => updateDoc(d.ref, { readAt: serverTimestamp() })));
}
