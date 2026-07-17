import React, { useMemo } from 'react';
import { Home, CalendarDays, MessageSquare, FileText, User } from 'lucide-react';
import { load, STORAGE_KEYS } from './storage.js';

const NAV_ITEMS = [
  { id: 'accueil',   label: 'Accueil',    Icon: Home },
  { id: 'agenda',    label: 'Agenda',     Icon: CalendarDays },
  { id: 'messages',  label: 'Messages',   Icon: MessageSquare },
  { id: 'documents', label: 'Documents',  Icon: FileText },
  { id: 'profil',    label: 'Profil',     Icon: User },
];

export default function BottomNav({ active, onChange, ben }) {
  const msgCount = useMemo(() => {
    const chats = load(STORAGE_KEYS.chats, {});
    return (chats?.beneficiaryConversations?.[ben?.id] || []).length;
  }, [ben, active]);

  const today = new Date().toISOString().slice(0, 10);
  const rdvCount = useMemo(() => {
    const agendas = load(STORAGE_KEYS.agendas, {});
    return (agendas?.beneficiary?.[ben?.structureId] || [])
      .filter(e => e.beneficiaryId === ben?.id && (e.startAt || '') >= today).length;
  }, [ben, active]);

  const dots = { messages: msgCount > 0, agenda: rdvCount > 0 };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navigation principale">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`nav-item ${active === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
          aria-label={label}
        >
          <Icon size={22} strokeWidth={active === id ? 2.2 : 1.8} />
          <span>{label}</span>
          {dots[id] && <span className="nav-dot" aria-hidden="true" />}
        </button>
      ))}
    </nav>
  );
}
