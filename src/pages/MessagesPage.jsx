import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquareOff, FileText, Paperclip } from 'lucide-react';
import { envoyerMessage, marquerCommeLus } from '../donnees.js';
import { urlSure } from '../utils.js';

function dateHeure(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function lienPieceJointe(m) {
  if (m.document?.url) return null;
  const a = m.attachment;
  return a ? urlSure(a.url || a.downloadUrl || a.downloadURL || a.dataUrl) : '';
}

const styleLien = {
  display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '8px 10px', borderRadius: 10,
  background: 'rgba(255,255,255,0.85)', color: '#1d4ed8', fontWeight: 600, fontSize: '0.85rem',
  textDecoration: 'none', border: '1px solid #bfdbfe', wordBreak: 'break-word',
};

export default function MessagesPage({ fiche, structureId, messages }) {
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const bas = useRef(null);
  const zone = useRef(null);

  const aMarquer = messages.some((m) => m.authorType === 'professional' && !m.readAt);
  useEffect(() => {
    if (aMarquer) marquerCommeLus(fiche.id).catch(() => {});
  }, [aMarquer, fiche.id]);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function envoyer() {
    const msg = texte.trim();
    if (!msg || envoi) return;
    setEnvoi(true);
    setErreur('');
    try {
      await envoyerMessage(fiche, structureId, msg);
      setTexte('');
      zone.current?.focus();
    } catch {
      setErreur('Message non envoyé. Vérifiez votre connexion et réessayez.');
    }
    setEnvoi(false);
  }

  return (
    <main className="page-content" style={{ paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 76px)' }}>
      <div className="page-header">
        <h1>Messages</h1>
        <p>Échanges avec votre référent(e)</p>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <MessageSquareOff size={40} aria-hidden="true" />
          <p>Aucun message pour l'instant.</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>Écrivez à votre référent(e) ci-dessous.</p>
        </div>
      ) : (
        <div className="msg-thread" style={{ padding: '12px 0' }} aria-live="polite">
          {messages.map((m) => {
            const moi = m.authorType === 'beneficiary';
            const convocation = m.kind === 'convocation';
            const pj = lienPieceJointe(m);
            const docUrl = urlSure(m.document?.url);
            return (
              <div key={m.id} className="msg-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: moi ? 'flex-end' : 'flex-start' }}>
                <div className="bubble-meta" style={{ textAlign: moi ? 'right' : 'left' }}>
                  {moi ? 'Moi' : (m.authorName || 'Mon référent')} · {dateHeure(m.createdAt)}
                </div>
                <div
                  className={`bubble ${moi ? 'sent' : 'received'}`}
                  style={{ whiteSpace: 'pre-line', ...(convocation ? { borderLeft: '4px solid #d97706', background: '#fffbeb', color: '#78350f' } : {}) }}
                >
                  {m.content}
                  {pj ? (
                    <a href={pj} target="_blank" rel="noopener noreferrer" style={styleLien}>
                      <Paperclip size={16} aria-hidden="true" /> {m.attachment?.name || 'Ouvrir la pièce jointe'}
                    </a>
                  ) : null}
                  {docUrl ? (
                    <a href={docUrl} target="_blank" rel="noopener noreferrer" style={styleLien}>
                      <FileText size={16} aria-hidden="true" /> Ouvrir le document
                    </a>
                  ) : null}
                </div>
                {moi ? (
                  <div style={{ fontSize: '0.68rem', color: m.readAt ? '#0e9f6e' : '#94a3b8', marginTop: 2 }}>
                    {m.readAt ? '✓✓ Lu' : '✓ Envoyé'}
                  </div>
                ) : null}
              </div>
            );
          })}
          <div ref={bas} />
        </div>
      )}

      {erreur ? <div className="error-box" role="alert" style={{ margin: '0 16px' }}>{erreur}</div> : null}

      <div className="input-bar">
        <label htmlFor="message" className="sr-only">Votre message</label>
        <textarea
          id="message"
          ref={zone}
          rows={1}
          placeholder="Écrire un message…"
          value={texte}
          maxLength={5000}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
        />
        <button type="button" className="send-btn" onClick={envoyer} disabled={!texte.trim() || envoi} aria-label="Envoyer">
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
