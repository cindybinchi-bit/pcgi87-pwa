import React from 'react';
import { LogOut, MessageSquare, KeyRound, ShieldCheck } from 'lucide-react';
import { seDeconnecter } from '../firebase.js';
import { formatDate, classeStatut, initiales, CONTACTS_STRUCTURES } from '../utils.js';

export default function ProfilPage({ fiche, structureId, onNavigate, onChangerCode, onConfidentialite }) {
  const structure = CONTACTS_STRUCTURES[structureId]?.nom || '';
  return (
    <main className="page-content">
      <div className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">{initiales(fiche.prenom, fiche.nom)}</div>
        <h1>{fiche.prenom} {fiche.nom}</h1>
        {structure ? <p>{structure}</p> : null}
        {fiche.statut ? <div style={{ marginTop: 10 }}><span className={`badge ${classeStatut(fiche.statut)}`}>{fiche.statut}</span></div> : null}
      </div>

      <div className="section-label" style={{ marginTop: 8 }}>Mes informations</div>
      <div className="card">
        <div className="info-row"><span>Nom complet</span><span>{fiche.prenom} {fiche.nom}</span></div>
        <div className="info-row"><span>Email</span><span>{fiche.email || '—'}</span></div>
        <div className="info-row"><span>Téléphone</span><span>{fiche.telephone || '—'}</span></div>
        <div className="info-row"><span>Date d'entrée</span><span>{formatDate(fiche.dateEntree)}</span></div>
        <div className="info-row"><span>Prescripteur</span><span>{fiche.prescripteur || '—'}</span></div>
        <div className="info-row" style={{ borderBottom: 'none' }}>
          <span>Projet professionnel</span>
          <span style={{ maxWidth: '55%', textAlign: 'right' }}>{fiche.projetProfessionnel || '—'}</span>
        </div>
      </div>
      <p style={{ fontSize: '0.78rem', padding: '0 20px 8px' }}>
        Une information est fausse ? Demandez à votre référent(e) de la corriger (droit de rectification).
      </p>

      <div className="section-label">Sécurité et confidentialité</div>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={() => onNavigate('messages')} style={{ justifyContent: 'flex-start' }}>
          <MessageSquare size={18} aria-hidden="true" /> Contacter mon référent(e)
        </button>
        <button type="button" className="btn btn-secondary" onClick={onChangerCode} style={{ justifyContent: 'flex-start' }}>
          <KeyRound size={18} aria-hidden="true" /> Changer mon code d'accès
        </button>
        <button type="button" className="btn btn-secondary" onClick={onConfidentialite} style={{ justifyContent: 'flex-start' }}>
          <ShieldCheck size={18} aria-hidden="true" /> Mes données et mes droits
        </button>
        <button type="button" className="btn btn-danger" onClick={() => seDeconnecter()} style={{ justifyContent: 'flex-start' }}>
          <LogOut size={18} aria-hidden="true" /> Se déconnecter
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-subtle)', padding: 16 }}>
        Mon Espace PCGI 87 · version 2.0
      </p>
    </main>
  );
}
