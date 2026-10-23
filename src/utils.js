export const STRUCTURES_PAR_DEFAUT = [
  { id: 'struct_001', nom: 'Inkéo C&C' },
  { id: 'struct_002', nom: 'Respir' },
];

/**
 * Coordonnées affichées dans « Mes données et mes droits ».
 * À compléter si une nouvelle structure rejoint la plateforme.
 */
export const CONTACTS_STRUCTURES = {
  struct_001: { nom: 'Inkéo C&C', email: 'inkeoc&c@francemel.fr', adresse: 'Saint-Yrieix-la-Perche' },
  struct_002: { nom: 'Respir', email: 'respir.compta@orange.fr', adresse: '4, rue de la Seynie, 87500 Saint-Yrieix-la-Perche' },
};

/** Anciennes données laissées sur le téléphone par la version précédente. */
const ANCIENNES_CLES = [
  'pcgi87.beneficiaires.v30',
  'pcgi87.benefSession.v1',
  'pcgi87.agendas.v30',
  'pcgi87.chats.v30',
  'fcm_tokens',
];

export function nettoyerAnciennesDonnees() {
  try {
    ANCIENNES_CLES.forEach((cle) => localStorage.removeItem(cle));
  } catch { /* stockage indisponible : rien à nettoyer */ }
}

export function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

export function formatDateHeure(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function joursDepuis(d) {
  if (!d) return 0;
  const n = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function initiales(prenom, nom) {
  return (((prenom || '')[0] || '') + ((nom || '')[0] || '')).toUpperCase() || '?';
}

export function classeStatut(statut) {
  const map = {
    'En cours': 'badge-blue',
    'Sorti positif': 'badge-green',
    'Sorti negatif': 'badge-red',
    'Sorti négatif': 'badge-red',
    'En attente': 'badge-amber',
    Suspendu: 'badge-gray',
    Urgence: 'badge-red',
    Sortie: 'badge-gray',
  };
  return map[statut] || 'badge-gray';
}

export function libelleType(type) {
  const map = {
    rdv_referent: 'RDV référent',
    atelier_collectif: 'Atelier collectif',
    rdv_administratif: 'RDV administratif',
    reunion: 'Réunion',
    rappel: 'Rappel',
    prestation: 'Prestation extérieure',
    absence: 'Absence',
    cp: 'Congé payé',
  };
  return map[type] || type || 'Événement';
}

export function urlSure(url) {
  const u = String(url || '');
  return /^https:\/\//i.test(u) ? u : '';
}
