import React from 'react';
import { Home, CalendarDays, MessageSquare, FileText, User } from 'lucide-react';

const ENTREES = [
  { id: 'accueil', label: 'Accueil', Icon: Home },
  { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { id: 'messages', label: 'Messages', Icon: MessageSquare },
  { id: 'documents', label: 'Documents', Icon: FileText },
  { id: 'profil', label: 'Profil', Icon: User },
];

export default function BarreNavigation({ active, onChange, nonLus, aSigner = 0 }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {ENTREES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-item ${active === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon size={22} strokeWidth={active === id ? 2.2 : 1.8} aria-hidden="true" />
          <span>{label}</span>
          {id === 'messages' && nonLus > 0 ? (
            <span className="nav-dot" aria-label={`${nonLus} message${nonLus > 1 ? 's' : ''} non lu${nonLus > 1 ? 's' : ''}`} />
          ) : null}
          {id === 'documents' && aSigner > 0 ? (
            <span className="nav-dot" style={{ background: '#f59e0b' }} aria-label={`${aSigner} document${aSigner > 1 ? 's' : ''} à signer`} />
          ) : null}
        </button>
      ))}
    </nav>
  );
}
