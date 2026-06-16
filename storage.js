// Clés partagées avec l'application principale PCGI 87
export const STORAGE_KEYS = {
  structures:       'pcgi87.structures.v30',
  beneficiaires:    'pcgi87.beneficiaires.v30',
  agendas:          'pcgi87.agendas.v30',
  chats:            'pcgi87.chats.v30',
  secretariat:      'pcgi87.secretariat.v30',
  session:          'pcgi87.benefSession.v1',
};

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

export function formatDate(d, opts = {}) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', ...opts });
  } catch { return d; }
}

export function formatDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
}

export function initials(prenom = '', nom = '') {
  return ((prenom[0] || '') + (nom[0] || '')).toUpperCase() || '?';
}

export function daysSince(d) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export function statusBadgeClass(statut) {
  const map = {
    'En cours':       'badge-blue',
    'Sorti positif':  'badge-green',
    'Sorti négatif':  'badge-red',
    'En attente':     'badge-amber',
    'Suspendu':       'badge-gray',
  };
  return map[statut] || 'badge-gray';
}

export function typeLabel(type) {
  const map = {
    rdv_referent:       'RDV référent',
    atelier_collectif:  'Atelier collectif',
    rdv_administratif:  'RDV administratif',
    reunion:            'Réunion',
    rappel:             'Rappel',
    atelier_structure:  'Atelier structure',
  };
  return map[type] || type || 'Événement';
}

export const STRUCTURE_NAMES = {
  struct_001: 'Inkéo C&C — Limoges',
};

// Bénéficiaire de démo (quand localStorage vide)
export const DEMO_BEN = {
  id:                  'demo_001',
  prenom:              'Sophie',
  nom:                 'Martin',
  email:               'sophie.martin@email.fr',
  telephone:           '06 12 34 56 78',
  statut:              'En cours',
  structureId:         'struct_001',
  dateEntree:          '2026-01-15',
  prescripteur:        'France Travail',
  projetProfessionnel: 'Aide-soignante',
  accessCode:          'PCGI87!',
};
