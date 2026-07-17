import React, { useState, useRef, useEffect } from 'react';
import { formatDateTime } from './storage.js';
import {
  initFirebase,
  getBeneficiaryConversationId,
  sendBeneficiaryMessage,
  onMessagesChange,
  markMessagesAsReadByBeneficiary,
} from './firebase-service.js';
import { Send, MessageSquareOff } from 'lucide-react';

export default function MessagesPage({ ben }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const conversationId = getBeneficiaryConversationId(ben.id);

  // Écoute en temps réel les messages depuis Firestore, et marque
  // automatiquement comme lus les messages du référent à l'ouverture.
  useEffect(() => {
    let unsub = () => {};
    initFirebase()
      .then(() => {
        unsub = onMessagesChange(conversationId, (list) => {
          setMessages(list);
        });
        markMessagesAsReadByBeneficiary(conversationId).catch((err) =>
          console.warn('Accusé de lecture bénéficiaire :', err)
        );
      })
      .catch((err) => console.warn('Firebase non disponible :', err));
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      await sendBeneficiaryMessage(conversationId, ben, msg);
      setText('');
      textareaRef.current?.focus();
    } catch (err) {
      console.error('Erreur envoi message :', err);
    }
    setSending(false);
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
            const isMine = m.authorType === 'beneficiary';
            return (
              <div key={m.id || i} className="msg-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div className="bubble-meta" style={{ textAlign: isMine ? 'right' : 'left' }}>
                  {isMine ? 'Moi' : 'Mon référent'} · {formatDateTime(m.createdAt)}
                </div>
                <div className={`bubble ${isMine ? 'sent' : 'received'}`}>
                  {m.content}
                </div>
                {isMine ? (
                  <div style={{ fontSize: '0.68rem', color: m.readAt ? '#0e9f6e' : '#94a3b8', marginTop: 2 }}>
                    {m.readAt ? '✓✓ Lu' : '✓ Envoyé'}
                  </div>
                ) : null}
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
        <button className="send-btn" onClick={handleSend} disabled={!text.trim() || sending} aria-label="Envoyer">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
