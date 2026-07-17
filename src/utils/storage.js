export const STORAGE_KEYS = {
  beneficiaires: 'pcgi87.beneficiaires.v30',
  session: 'pcgi87.benefSession.v1',
  agendas: 'pcgi87.agendas.v30',
  chats: 'pcgi87.chats.v30',
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

export const STRUCTURE_NAMES = {
  struct_001: 'Inkeo C&C - Saint-Yrieix-la-Perche',
  struct_002: 'Respir - Saint-Yrieix-la-Perche',
};

export function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fr-FR'); }
  catch { return d; }
}

export function formatDateTime(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch { return d; }
}

export function daysSince(d) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export function initials(prenom, nom) {
  return (((prenom || '')[0] || '') + ((nom || '')[0] || '')).toUpperCase() || '?';
}

export function statusBadgeClass(statut) {
  const map = {
    'En cours': 'badge-blue',
    'Sorti positif': 'badge-green',
    'Sorti negatif': 'badge-red',
    'En attente': 'badge-amber',
    'Suspendu': 'badge-gray',
    'Urgence': 'badge-red',
    'Sortie': 'badge-gray',
  };
  return map[statut] || 'badge-gray';
}

export function typeLabel(type) {
  const map = {
    rdv_referent: 'RDV referent',
    atelier_collectif: 'Atelier collectif',
    rdv_administratif: 'RDV administratif',
    reunion: 'Reunion',
    rappel: 'Rappel',
    prestation: 'Prestation exterieure',
    absence: 'Absence',
    cp: 'Conge paye',
  };
  return map[type] || type || 'Evenement';
}
