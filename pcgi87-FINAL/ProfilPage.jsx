import React from 'react';
import { save, STORAGE_KEYS, formatDate, statusBadgeClass, initials, STRUCTURE_NAMES } from './storage.js';
import { LogOut, MessageSquare } from 'lucide-react';

export default function ProfilPage({ ben, onLogout, onNavigate }) {
  function handleLogout() {
    save(STORAGE_KEYS.session, null);
    onLogout();
  }

  const ini = initials(ben.prenom, ben.nom);

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar">{ini}</div>
        <h1>{ben.prenom} {ben.nom}</h1>
        <p>{STRUCTURE_NAMES[ben.structureId] || ben.structureId}</p>
        <div style={{ marginTop: 10 }}>
          <span className={`badge ${statusBadgeClass(ben.statut)}`}>{ben.statut}</span>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 8 }}>Informations</div>
      <div className="card">
        <div className="info-row">
          <span>Nom complet</span>
          <span>{ben.prenom} {ben.nom}</span>
        </div>
        <div className="info-row">
          <span>Email</span>
          <span>{ben.email || '—'}</span>
        </div>
        <div className="info-row">
          <span>Téléphone</span>
          <span>{ben.telephone || '—'}</span>
        </div>
        <div className="info-row">
          <span>Date d'entrée</span>
          <span>{formatDate(ben.dateEntree)}</span>
        </div>
        <div className="info-row">
          <span>Prescripteur</span>
          <span>{ben.prescripteur || '—'}</span>
        </div>
        <div className="info-row" style={{ borderBottom: 'none' }}>
          <span>Projet professionnel</span>
          <span style={{ maxWidth: '55%', textAlign: 'right' }}>{ben.projetProfessionnel || '—'}</span>
        </div>
      </div>

      <div className="section-label">Contact & actions</div>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <button className="btn btn-secondary" onClick={() => onNavigate('messages')}
          style={{ justifyContent: 'flex-start', gap: 10 }}>
          <MessageSquare size={18} />
          Contacter mon référent(e)
        </button>
        <button className="btn btn-ghost" onClick={handleLogout}
          style={{ justifyContent: 'flex-start', gap: 10, color: 'var(--red-700)', borderColor: 'var(--red-50)', background: 'var(--red-50)' }}>
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-subtle)', padding: '16px', marginTop: 4 }}>
        Mon Espace PCGI 87 · v1.0
        <br />Pour modifier vos informations, contactez votre référent(e).
      </p>
    </div>
  );
}
