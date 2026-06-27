import React, { useState, useRef, useEffect } from 'react';
import { formatDateTime } from './storage.js';
import {
  initFirebase,
  getBeneficiaryConversationIds,
  sendBeneficiaryMessage,
  onMessagesChange,
  markMessagesAsReadByBeneficiary,
} from './firebase-service.js';
import { Send, MessageSquareOff, ChevronLeft } from 'lucide-react';

export default function MessagesPage({ ben }) {
  const [conversations, setConversations] = useState([]); // [{ id, referentName }]
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Charger toutes les conversations du bénéficiaire (un fil par référent)
  useEffect(() => {
    setLoading(true);
    initFirebase()
      .then(() => getBeneficiaryConversationIds(ben.id))
      .then((convs) => {
        setConversations(convs);
        // Ouvrir automatiquement le premier fil s'il n'y en a qu'un
        if (convs.length === 1) setActiveConvId(convs[0].id);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Impossible de charger les conversations:', err);
        setLoading(false);
      });
  }, [ben.id]);

  // Écouter les messages du fil actif en temps réel
  useEffect(() => {
    if (!activeConvId) return;
    const unsub = onMessagesChange(activeConvId, (list) => {
      setMessages(list);
    });
    markMessagesAsReadByBeneficiary(activeConvId).catch((err) =>
      console.warn('Accusé de lecture:', err)
    );
    return () => unsub();
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const msg = text.trim();
    if (!msg || sending || !activeConvId) return;
    setSending(true);
    try {
      await sendBeneficiaryMessage(activeConvId, ben, msg);
      setText('');
      textareaRef.current?.focus();
    } catch (err) {
      console.error('Erreur envoi message:', err);
    }
    setSending(false);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // ── Vue liste des fils (si plusieurs référents) ──
  if (!activeConvId) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1>Messages</h1>
          <p>Choisissez un fil de discussion</p>
        </div>

        {loading ? (
          <p className="muted" style={{ textAlign: 'center', marginTop: 40 }}>Chargement…</p>
        ) : conversations.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <MessageSquareOff size={40} />
            <p>Aucun message pour l'instant.</p>
            <p style={{ marginTop: 6, fontSize: '0.78rem' }}>
              Votre référent(e) vous contactera bientôt.
            </p>
          </div>
        ) : (
          <div style={{ padding: '12px 0' }}>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  padding: '14px 16px', marginBottom: 8, borderRadius: 12,
                  background: 'var(--card-bg, #fff)', border: '1px solid var(--border)',
                  cursor: 'pointer', textAlign: 'left', gap: 12,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6B2C91, #D6266E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 16,
                }}>
                  {conv.referentName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main, #1a1a2e)' }}>
                    {conv.referentName}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle, #888)', marginTop: 2 }}>
                    {conv.referentEmail}
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-subtle, #888)', fontSize: 20 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vue fil actif ──
  return (
    <div className="page-content" style={{ paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 72px)' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {conversations.length > 1 && (
          <button
            onClick={() => { setActiveConvId(null); setMessages([]); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            aria-label="Retour"
          >
            <ChevronLeft size={22} color="var(--violet, #6B2C91)" />
          </button>
        )}
        <div>
          <h1 style={{ margin: 0 }}>Messages</h1>
          <p style={{ margin: 0 }}>
            {activeConv ? `Fil avec ${activeConv.referentName}` : 'Échanges avec votre référent(e)'}
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <MessageSquareOff size={40} />
          <p>Aucun message dans ce fil.</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>
            Envoyez un premier message à votre référent(e).
          </p>
        </div>
      ) : (
        <div className="msg-thread" style={{ padding: '12px 0' }}>
          {messages.map((m, i) => {
            const isMine = m.authorType === 'beneficiary';
            return (
              <div key={m.id || i} className="msg-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <div className="bubble-meta" style={{ textAlign: isMine ? 'right' : 'left' }}>
                  {isMine ? 'Moi' : (activeConv?.referentName || 'Mon référent')} · {formatDateTime(m.createdAt)}
                </div>
                <div className={`bubble ${isMine ? 'sent' : 'received'}`}>
                  {m.content}
                </div>
                {isMine && (
                  <div style={{ fontSize: '0.68rem', color: m.readAt ? '#0e9f6e' : '#94a3b8', marginTop: 2 }}>
                    {m.readAt ? '✓✓ Lu' : '✓ Envoyé'}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

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
