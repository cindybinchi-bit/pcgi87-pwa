import React, { useMemo, useState } from 'react';
import { CalendarOff } from 'lucide-react';
import { libelleType } from '../utils.js';

const COULEURS = {
  rdv_referent: { bg: '#e6f1fb', color: 'var(--blue-800)' },
  atelier_collectif: { bg: '#eaf3de', color: 'var(--green-700)' },
  rdv_administratif: { bg: '#faeeda', color: 'var(--amber-700)' },
  reunion: { bg: '#f1efe8', color: '#5f5e5a' },
  rappel: { bg: '#fcebeb', color: 'var(--red-700)' },
  prestation: { bg: '#f3e8ff', color: '#7c3aed' },
};

function Carte({ evenement: e }) {
  const debut = e.startAt ? new Date(e.startAt) : null;
  const fin = e.endAt ? new Date(e.endAt) : null;
  const valide = debut && !Number.isNaN(debut.getTime());
  const couleurs = COULEURS[e.type] || { bg: '#f1efe8', color: '#5f5e5a' };
  return (
    <div className="agenda-card">
      <div className="agenda-date-chip">
        <span>{valide ? debut.toLocaleDateString('fr-FR', { month: 'short' }) : ''}</span>
        <strong>{valide ? debut.toLocaleDateString('fr-FR', { day: '2-digit' }) : '—'}</strong>
      </div>
      <div className="agenda-info" style={{ flex: 1 }}>
        <strong>{e.title || libelleType(e.type)}</strong>
        <p>
          {valide ? debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
          {fin && e.endAt !== e.startAt && !Number.isNaN(fin.getTime())
            ? ` → ${fin.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </p>
        {e.lieu ? <p style={{ marginTop: 4, fontSize: '0.8rem' }}>📍 {e.lieu}</p> : null}
        {e.notes ? <p style={{ marginTop: 4, fontStyle: 'italic', fontSize: '0.8rem' }}>{e.notes}</p> : null}
        <span className="badge" style={{ background: couleurs.bg, color: couleurs.color, marginTop: 6 }}>{libelleType(e.type)}</span>
      </div>
    </div>
  );
}

export default function AgendaPage({ agenda }) {
  const [onglet, setOnglet] = useState('avenir');
  const { avenir, passes } = useMemo(() => {
    const auj = new Date().toISOString().slice(0, 10);
    return {
      avenir: agenda.filter((e) => (e.startAt || '') >= auj).sort((a, b) => String(a.startAt).localeCompare(String(b.startAt))),
      passes: agenda.filter((e) => (e.startAt || '') < auj).sort((a, b) => String(b.startAt).localeCompare(String(a.startAt))),
    };
  }, [agenda]);
  const liste = onglet === 'avenir' ? avenir : passes;

  return (
    <main className="page-content">
      <div className="page-header">
        <h1>Mon agenda</h1>
        <p>Rendez-vous et ateliers programmés</p>
      </div>
      <div className="tab-bar" role="tablist">
        <button type="button" role="tab" aria-selected={onglet === 'avenir'} className={`tab-pill ${onglet === 'avenir' ? 'active' : ''}`} onClick={() => setOnglet('avenir')}>
          À venir ({avenir.length})
        </button>
        <button type="button" role="tab" aria-selected={onglet === 'passes'} className={`tab-pill ${onglet === 'passes' ? 'active' : ''}`} onClick={() => setOnglet('passes')}>
          Passés ({passes.length})
        </button>
      </div>
      {liste.length === 0 ? (
        <div className="empty-state">
          <CalendarOff size={40} aria-hidden="true" />
          <p>{onglet === 'avenir' ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous passé.'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {liste.map((e) => <Carte key={e.id} evenement={e} />)}
        </div>
      )}
    </main>
  );
}
