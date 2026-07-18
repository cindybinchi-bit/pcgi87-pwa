import React, { useMemo } from 'react';
import { load, STORAGE_KEYS, formatDate, formatDateTime, statusBadgeClass, daysSince, typeLabel, STRUCTURE_NAMES } from '../utils/storage.js';
import { CalendarDays, MessageSquare, FileText, ChevronRight } from 'lucide-react';

export default function AccueilPage({ ben, onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);

  const upcomingRdv = useMemo(() => {
    const agendas = load(STORAGE_KEYS.agendas, {});
    const list = agendas?.beneficiary?.[ben.structureId] || [];
    return list
      .filter(e => e.beneficiaryId === ben.id && (e.startAt || '') >= today)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 3);
  }, [ben]);

  const unreadCount = useMemo(() => {
    const chats = load(STORAGE_KEYS.chats, {});
    return (chats?.beneficiaryConversations?.[ben.id] || []).length;
  }, [ben]);

  const jours = daysSince(ben.dateEntree);
  const nextRdv = upcomingRdv[0];

  return (
    <div className="page-content">
      {/* Hero card */}
      <div style={{ background: 'var(--navy)', padding: '20px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: '56px', height: '56px', borderRadius: '8px' }} />
          <div>
            <p style={{ color: '#c084fc', fontSize: '0.82rem', marginBottom: 4, fontWeight: 600 }}>
              Bonjour ðŸ‘‹
            </p>
            <h1 style={{ color: '#e9d5ff', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>
              {ben.prenom} {ben.nom}
            </h1>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`badge ${statusBadgeClass(ben.statut)}`}>{ben.statut}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
            {STRUCTURE_NAMES[ben.structureId] || ben.structureId}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-tile">
          <span>Jours en parcours</span>
          <strong>{jours}</strong>
        </div>
        <div className="stat-tile">
          <span>RDV Ã  venir</span>
          <strong>{upcomingRdv.length}</strong>
        </div>
        <div className="stat-tile">
          <span>Messages</span>
          <strong>{unreadCount}</strong>
        </div>
      </div>

      {/* Prochain RDV */}
      {nextRdv && (
        <div className="notif-banner">
          <CalendarDays size={16} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.82rem' }}>
              {nextRdv.title || typeLabel(nextRdv.type)}
            </strong>
            <span style={{ fontSize: '0.75rem' }}>{formatDateTime(nextRdv.startAt)}</span>
          </div>
        </div>
      )}

      {/* Mon parcours */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <h3>Mon parcours</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--blue-700)', fontWeight: 500 }}>
            {ben.projetProfessionnel || 'À définir'}
          </span>
        </div>
        <div className="info-row">
          <span>Entrée</span>
          <span>{formatDate(ben.dateEntree)}</span>
        </div>
        <div className="info-row">
          <span>Prescripteur</span>
          <span>{ben.prescripteur || 'â€”'}</span>
        </div>
        <div className="info-row" style={{ borderBottom: 'none' }}>
          <span>Projet professionnel</span>
          <span>{ben.projetProfessionnel || 'â€”'}</span>
        </div>
      </div>

      {/* Raccourcis */}
      <div className="section-label">AccÃ¨s rapide</div>
      <div className="card" style={{ padding: 0 }}>
        <button className="list-item" style={{ width: '100%', textAlign: 'left', background: 'none' }}
          onClick={() => onNavigate('agenda')}>
          <div className="list-item-icon" style={{ background: 'var(--blue-50)' }}>
            <CalendarDays size={20} color="var(--blue-700)" />
          </div>
          <div className="list-item-content">
            <strong>Agenda</strong>
            <p>{upcomingRdv.length} rendez-vous Ã  venir</p>
          </div>
          <ChevronRight size={16} color="var(--text-subtle)" />
        </button>

        <button className="list-item" style={{ width: '100%', textAlign: 'left', background: 'none' }}
          onClick={() => onNavigate('messages')}>
          <div className="list-item-icon" style={{ background: '#faeeda' }}>
            <MessageSquare size={20} color="var(--amber-700)" />
          </div>
          <div className="list-item-content">
            <strong>Messages</strong>
            <p>{unreadCount} message{unreadCount > 1 ? 's' : ''} dans votre fil</p>
          </div>
          <ChevronRight size={16} color="var(--text-subtle)" />
        </button>

        <button className="list-item" style={{ width: '100%', textAlign: 'left', background: 'none', borderBottom: 'none' }}
          onClick={() => onNavigate('documents')}>
          <div className="list-item-icon" style={{ background: 'var(--green-50)' }}>
            <FileText size={20} color="var(--green-700)" />
          </div>
          <div className="list-item-content">
            <strong>Documents</strong>
            <p>Vos piÃ¨ces et documents partagés</p>
          </div>
          <ChevronRight size={16} color="var(--text-subtle)" />
        </button>
      </div>
    </div>
  );
}


