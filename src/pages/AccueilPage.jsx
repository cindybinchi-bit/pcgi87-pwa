import React, { useMemo } from 'react';
import { CalendarDays, MessageSquare, FileText, ChevronRight, Target } from 'lucide-react';
import { formatDate, formatDateHeure, classeStatut, joursDepuis, libelleType, CONTACTS_STRUCTURES } from '../utils.js';

const OUTIL_CV = 'https://ursdac-jpg.github.io/TRE-ERIP/#cv';

export default function AccueilPage({ fiche, structureId, agenda, nonLus, onNavigate }) {
  const aVenir = useMemo(() => {
    const maintenant = new Date().toISOString().slice(0, 10);
    return agenda
      .filter((e) => (e.startAt || '') >= maintenant)
      .sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
  }, [agenda]);
  const prochain = aVenir[0];
  const structure = CONTACTS_STRUCTURES[structureId]?.nom || '';

  return (
    <main className="page-content">
      <div style={{ background: 'var(--navy)', padding: '20px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/pcgi-logo.jpg" alt="" style={{ width: 56, height: 56, borderRadius: 8 }} />
          <div>
            <p style={{ color: '#c084fc', fontSize: '0.82rem', marginBottom: 4, fontWeight: 600 }}>Bonjour !</p>
            <h1 style={{ color: '#e9d5ff', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>{fiche.prenom} {fiche.nom}</h1>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {fiche.statut ? <span className={`badge ${classeStatut(fiche.statut)}`}>{fiche.statut}</span> : null}
          {structure ? <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>{structure}</span> : null}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-tile"><span>Jours en parcours</span><strong>{joursDepuis(fiche.dateEntree)}</strong></div>
        <div className="stat-tile"><span>RDV à venir</span><strong>{aVenir.length}</strong></div>
        <div className="stat-tile"><span>Non lus</span><strong>{nonLus}</strong></div>
      </div>

      {prochain ? (
        <div className="notif-banner">
          <CalendarDays size={16} aria-hidden="true" />
          <div>
            <strong style={{ display: 'block', fontSize: '0.82rem' }}>{prochain.title || libelleType(prochain.type)}</strong>
            <span style={{ fontSize: '0.75rem' }}>{formatDateHeure(prochain.startAt)}</span>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Mon parcours</h3>
        <div className="info-row"><span>Entrée</span><span>{formatDate(fiche.dateEntree)}</span></div>
        <div className="info-row"><span>Prescripteur</span><span>{fiche.prescripteur || '—'}</span></div>
        <div className="info-row" style={{ borderBottom: 'none' }}><span>Projet professionnel</span><span>{fiche.projetProfessionnel || 'À définir'}</span></div>
      </div>

      <div className="section-label">Accès rapide</div>
      <div className="card" style={{ padding: 0 }}>
        <button type="button" className="list-item" style={{ width: '100%', textAlign: 'left' }} onClick={() => onNavigate('agenda')}>
          <div className="list-item-icon" style={{ background: 'var(--blue-50)' }}><CalendarDays size={20} color="var(--blue-700)" /></div>
          <div className="list-item-content"><strong>Agenda</strong><p>{aVenir.length} rendez-vous à venir</p></div>
          <ChevronRight size={16} color="var(--text-subtle)" aria-hidden="true" />
        </button>
        <button type="button" className="list-item" style={{ width: '100%', textAlign: 'left' }} onClick={() => onNavigate('messages')}>
          <div className="list-item-icon" style={{ background: '#faeeda' }}><MessageSquare size={20} color="var(--amber-700)" /></div>
          <div className="list-item-content"><strong>Messages</strong><p>{nonLus ? `${nonLus} nouveau${nonLus > 1 ? 'x' : ''} message${nonLus > 1 ? 's' : ''}` : 'Échanger avec votre référent(e)'}</p></div>
          <ChevronRight size={16} color="var(--text-subtle)" aria-hidden="true" />
        </button>
        <button type="button" className="list-item" style={{ width: '100%', textAlign: 'left' }} onClick={() => onNavigate('documents')}>
          <div className="list-item-icon" style={{ background: 'var(--green-50)' }}><FileText size={20} color="var(--green-700)" /></div>
          <div className="list-item-content"><strong>Documents</strong><p>Vos pièces et documents partagés</p></div>
          <ChevronRight size={16} color="var(--text-subtle)" aria-hidden="true" />
        </button>
        <a className="list-item" style={{ width: '100%', borderBottom: 'none' }} href={OUTIL_CV} target="_blank" rel="noopener noreferrer">
          <div className="list-item-icon" style={{ background: '#dcfce7' }}><Target size={20} color="#16a34a" /></div>
          <div className="list-item-content"><strong>Outil CV & entretien</strong><p>S'entraîner et préparer sa recherche d'emploi (site externe)</p></div>
          <ChevronRight size={16} color="var(--text-subtle)" aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}
