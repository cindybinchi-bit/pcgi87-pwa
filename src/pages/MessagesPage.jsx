import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Send, MessageSquareOff, FileText, Paperclip } from 'lucide-react';
import { envoyerMessage, marquerCommeLus, idConversation, CANAUX, canalParId } from '../donnees.js';
import { urlSure } from '../utils.js';
import FenetreDepot from '../components/FenetreDepot.jsx';

// Sur téléphone, « Entrée » fait un retour à la ligne ; on envoie avec le bouton.
const ECRAN_TACTILE = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

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

export default function MessagesPage({
  fiche, structureId, messages, brouillon = '', onBrouillon,
  canal = 'cip', onCanal, nonLusParCanal = {}, indisponible = false,
}) {
  const fil = canalParId(canal);
  // Le texte en cours est gardé par App : il reste là quand on change d'onglet.
  const texte = brouillon;
  const setTexte = (v) => onBrouillon?.(v);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [depot, setDepot] = useState(null); // null | { fichier }
  const [hauteurBarre, setHauteurBarre] = useState(64);
  const bas = useRef(null);
  const zone = useRef(null);
  const barre = useRef(null);

  // La zone d'écriture grandit avec le texte (jusqu'à 40 % de l'écran, puis défile).
  useLayoutEffect(() => {
    const el = zone.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = Math.round(window.innerHeight * 0.4);
    el.style.height = `${Math.min(el.scrollHeight + 2, max)}px`;
    el.style.overflowY = el.scrollHeight + 2 > max ? 'auto' : 'hidden';
  }, [texte]);

  // Les derniers messages ne doivent jamais être cachés derrière la zone d'écriture.
  useEffect(() => {
    const el = barre.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const obs = new ResizeObserver(() => setHauteurBarre(el.offsetHeight));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const aMarquer = messages.some((m) => m.authorType === 'professional' && !m.readAt);
  useEffect(() => {
    if (aMarquer) marquerCommeLus(idConversation(fiche.id, canal, structureId)).catch(() => {});
  }, [aMarquer, fiche.id, canal, structureId]);

  useEffect(() => {
    bas.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, canal]);

  useEffect(() => { setErreur(''); }, [canal]);

  async function envoyer() {
    const msg = texte.trim();
    if (!msg || envoi) return;
    setEnvoi(true);
    setErreur('');
    try {
      await envoyerMessage(fiche, structureId, msg, null, canal);
      setTexte('');
      zone.current?.focus();
    } catch (err) {
      setErreur(String(err?.code || '').includes('permission-denied')
        ? `Message non envoyé : cette messagerie n'est pas encore activée. Écrivez à votre référent(e).`
        : 'Message non envoyé. Vérifiez votre connexion et réessayez.');
    }
    setEnvoi(false);
  }

  return (
    <main
      className="page-content"
      onDragOver={(e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); }}
      onDrop={(e) => { const f = e.dataTransfer?.files?.[0]; if (f && !indisponible) { e.preventDefault(); setDepot({ fichier: f }); } }}
      style={{ paddingBottom: `calc(var(--nav-height) + var(--safe-bottom) + ${hauteurBarre + 12}px)` }}>
      <div className="page-header">
        <h1>Messages</h1>
        <p>À qui voulez-vous écrire ?</p>
      </div>

      <div className="canal-bar" role="tablist" aria-label="Choisir le destinataire">
        {CANAUX.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={canal === c.id}
            className={`tab-pill canal-pill ${canal === c.id ? 'active' : ''}`}
            onClick={() => onCanal?.(c.id)}
          >
            {c.court}
            {nonLusParCanal[c.id] > 0 && canal !== c.id ? (
              <span className="canal-compte" aria-label={`${nonLusParCanal[c.id]} non lu${nonLusParCanal[c.id] > 1 ? 's' : ''}`}>{nonLusParCanal[c.id]}</span>
            ) : null}
          </button>
        ))}
      </div>
      <p className="canal-secret">🔒 {fil.label} — {fil.secret}</p>

      {indisponible ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <MessageSquareOff size={40} aria-hidden="true" />
          <p>Cette messagerie n'est pas encore disponible.</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>En attendant, écrivez à votre référent(e) dans « Ma CIP ».</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <MessageSquareOff size={40} aria-hidden="true" />
          <p>Aucun message pour l'instant.</p>
          <p style={{ marginTop: 6, fontSize: '0.78rem' }}>Écrivez {fil.aVous} ci-dessous.</p>
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
                  {moi ? 'Moi' : (m.authorName || (canal === 'cip' ? 'Mon référent' : fil.court))} · {dateHeure(m.createdAt)}
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

      <div className="input-bar" ref={barre}>
        <button type="button" className="joindre-btn" onClick={() => setDepot({ fichier: null })} disabled={indisponible} aria-label="Envoyer un document ou une photo" title="Envoyer un document">
          <Paperclip size={20} aria-hidden="true" />
        </button>
        <label htmlFor="message" className="sr-only">Votre message</label>
        <textarea
          id="message"
          ref={zone}
          rows={1}
          placeholder={`Écrire ${fil.a}…`}
          value={texte}
          disabled={indisponible}
          maxLength={5000}
          enterKeyHint={ECRAN_TACTILE ? 'enter' : 'send'}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !ECRAN_TACTILE) { e.preventDefault(); envoyer(); }
          }}
        />
        <button type="button" className="send-btn" onClick={envoyer} disabled={!texte.trim() || envoi || indisponible} aria-label="Envoyer">
          <Send size={18} aria-hidden="true" />
        </button>
      </div>

      {depot ? (
        <FenetreDepot
          fiche={fiche}
          structureId={structureId}
          canal={canal}
          fichierInitial={depot.fichier}
          onFerme={() => setDepot(null)}
          onEnvoye={() => setDepot(null)}
        />
      ) : null}
    </main>
  );
}
