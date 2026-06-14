import React, { useState, useMemo, useRef, useEffect } from 'react';
import { load, save, STORAGE_KEYS, formatDateTime } from '../utils/storage.js';
import { Send, MessageSquareOff } from 'lucide-react';

function uid() {
  return `bmsg_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export default function MessagesPage({ ben }) {
  const [messages, setMessages] = useState(() => {
    const chats = load(STORAGE_KEYS.chats, {});
    return chats?.beneficiaryConversations?.[ben.id] || [];
  });
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const msg = text.trim();
    if (!msg) return;

    const newMsg = {
      id: uid(),
      createdAt: new Date().toISOString(),
      authorId: ben.id,
      authorName: `${ben.prenom} ${ben.nom}`,
      text: msg,
    };

    const chats = load(STORAGE_KEYS.chats, { channels: {}, directConversations: {}, beneficiaryConversations: {} });
    if (!chats.beneficiaryConversations) chats.beneficiaryConversations = {};
    const list = [...(chats.beneficiaryConversations[ben.id] || []), newMsg];
    chats.beneficiaryConversations[ben.id] = list;
    save(STORAGE_KEYS.chats, chats);
    setMessages(list);
    setText('');
    textareaRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="page-content" style={{ paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 72px)' }}>
      <div className="page-header">
        <h1>Messages</h1>
        <p>Échanges avec votre référent(e)</p>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <MessageSquareOff size={40} />
          <p>Aucun message pour l'instant.</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>
            Envoyez un message à votre référent(e) ci-dessous.
          </p>
        </div>
      ) : (
        <div className="msg-thread" style={{ padding: '12px 0' }}>
          {messages.map((m, i) => {
            const isMine = m.authorId === ben.id;
            return (
              <div key={m.id || i} className="msg-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div className="bubble-meta" style={{ textAlign: isMine ? 'right' : 'left' }}>
                  {isMine ? 'Moi' : 'Mon référent'} · {formatDateTime(m.createdAt)}
                </div>
                <div className={`bubble ${isMine ? 'sent' : 'received'}`}>
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Barre de saisie fixe */}
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Écrire un message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="send-btn" onClick={handleSend} disabled={!text.trim()} aria-label="Envoyer">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
