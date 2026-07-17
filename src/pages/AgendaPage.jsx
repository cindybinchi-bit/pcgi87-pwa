import React, { useState, useEffect } from 'react';
import { formatDateTime, typeLabel } from '../utils/storage.js';
import { initFirebase, onAgendaChange } from '../firebase-service.js';
import { CalendarOff } from 'lucide-react';

function AgendaCard({ event }) {
  const dt = event.startAt ? new Date(event.startAt) : null;
  const day   = dt ? dt.toLocaleDateString('fr-FR', { day: '2-digit' }) : '—';
  const month = dt ? dt.toLocaleDateString('fr-FR', { month: 'short' }) : '';
  const time  = dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const endDt = event.endAt ? new Date(event.endAt) : null;

  const typeColors = {
    rdv_referent:      { bg: '#e6f1fb', color: 'var(--blue-800)' },
    atelier_collectif: { bg: '#eaf3de', color: 'var(--green-700)' },
    rdv_administratif: { bg: '#faeeda', color: 'var(--amber-700)' },
    reunion:           { bg: '#f1efe8', color: '#5f5e5a' },
    rappel:            { bg: '#fcebeb', color: 'var(--red-700)' },
    prestation:        { bg: '#f3e8ff', color: '#7c3aed' },
  };
  const colors = typeColors[event.type] || { bg: '#f1efe8', color: '#5f5e5a' };

  return (
    <div className="agenda-card">
      <div className="agenda-date-chip">
        <span>{month}</span>
        <strong>{day}</strong>
      </div>
      <div className="agenda-info" style={{ flex: 1 }}>
        <strong>{event.title || typeLabel(event.type)}</strong>
        <p>
          {time && `${time}`}
          {endDt && event.endAt !== event.startAt && ` → ${endDt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
          {` · ${typeLabel(event.type)}`}
        </p>
        {event.notes && <p style={{ marginTop: 4, fontStyle: 'italic', fontSize: '0.8rem' }}>{event.notes}</p>}
        {event.sharedFrom && <p style={{ marginTop: 4, fontSize: '0.78rem', color: '#64748b' }}>Partagé par {event.sharedFrom}</p>}
        <span className="tag badge" style={{ background: colors.bg, color: colors.color, marginTop: 6 }}>
          {typeLabel(event.type)}
        </span>
      </div>
    </div>
  );
}

export default function AgendaPage({ ben }) {
  const [tab, setTab] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let unsub = () => {};
    initFirebase()
      .then(() => {
        unsub = onAgendaChange(ben.structureId, (allEvents) => {
          // Filtrer les événements du bénéficiaire :
          // 1. Événements directs (beneficiaryId)
          // 2. Prestations extérieures affiliées
          const myEvents = allEvents.filter(e =>
            e.beneficiaryId === ben.id ||
            (e.beneficiairesAffilies || []).includes(ben.id) ||
            e.scope === 'structure_prestation' && (e.beneficiairesAffilies || []).includes(ben.id)
          );
          setEvents(myEvents);
        });
      })
      .catch(err => console.warn('Firebase agenda non disponible :', err));
    return () => unsub();
  }, [ben.id, ben.structureId]);

  const upcoming = events.filter(e => (e.startAt || '') >= today).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past     = events.filter(e => (e.startAt || '') < today).sort((a, b) => b.startAt.localeCompare(a.startAt));
  const shown    = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Mon agenda</h1>
        <p>Rendez-vous et ateliers programmés</p>
      </div>

      <div className="tab-bar">
        <button className={`tab-pill ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          À venir ({upcoming.length})
        </button>
        <button className={`tab-pill ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          Passés ({past.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state">
          <CalendarOff size={40} />
          <p>{tab === 'upcoming' ? 'Aucun rendez-vous à venir.' : 'Aucun rendez-vous passé.'}</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>
            Votre référent(e) vous convoquera prochainement.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {shown.map(e => <AgendaCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}
