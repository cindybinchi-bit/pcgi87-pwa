import React, { useEffect, useRef, useState } from 'react';
import { mesSignatures, signerDocument, messageErreur } from '../firebase.js';

// PCGI 87 — PWA bénéficiaire : documents à signer (contrat d'engagement, évaluations)
// Tout passe par le serveur (fonctions mesSignatures / signerDocument) : la PWA ne lit ni
// n'écrit jamais directement les documents signés.


const TYPES = { contrat_engagement: "Contrat d'engagement", evaluation: 'Évaluation de mes compétences' };
const dateFr = (v) => (v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');
const message = (err) => messageErreur(err);

function PaveSignature({ onChange }) {
  const ref = useRef(null);
  const etat = useRef({ actif: false, points: 0 });
  useEffect(() => {
    const c = ref.current;
    if (!c || !c.getContext) return;
    const ratio = window.devicePixelRatio || 1;
    const largeur = Math.min((c.parentElement && c.parentElement.clientWidth) || 320, 560);
    c.width = largeur * ratio;
    c.height = 190 * ratio;
    c.style.width = `${largeur}px`;
    c.style.height = '190px';
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b1f4d';
  }, []);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const debut = (e) => { e.preventDefault(); const ctx = ref.current.getContext('2d'); const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); etat.current.actif = true; try { ref.current.setPointerCapture(e.pointerId); } catch { /* */ } };
  const bouge = (e) => { if (!etat.current.actif) return; e.preventDefault(); const ctx = ref.current.getContext('2d'); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); etat.current.points += 1; };
  const fin = () => { if (!etat.current.actif) return; etat.current.actif = false; if (etat.current.points > 8) onChange(ref.current.toDataURL('image/png')); };
  const effacer = () => { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); etat.current.points = 0; onChange(null); };
  return (
    <div>
      <canvas ref={ref} onPointerDown={debut} onPointerMove={bouge} onPointerUp={fin} onPointerLeave={fin}
        aria-label="Zone de signature"
        style={{ border: '2px dashed #94a3b8', borderRadius: 12, background: '#fff', touchAction: 'none', display: 'block', maxWidth: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#64748b', marginTop: 6 }}>
        <span>Signez avec le doigt dans le cadre</span>
        <button type="button" onClick={effacer} style={styles.boutonClair}>Recommencer</button>
      </div>
    </div>
  );
}

export default function SignaturesPage({ onAttente }) {
  const [docs, setDocs] = useState(null);
  const [erreur, setErreur] = useState('');
  const [ouvert, setOuvert] = useState(null);
  const [image, setImage] = useState(null);
  const [lu, setLu] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [info, setInfo] = useState('');

  const charger = async () => {
    setErreur('');
    try {
      const res = await mesSignatures();
      const liste = res?.documents || [];
      setDocs(liste);
      if (onAttente) onAttente(liste.filter((d) => d.statut === 'en_attente' && !d.signatures?.beneficiaire).length);
    } catch (err) {
      setErreur(message(err));
      setDocs([]);
    }
  };
  useEffect(() => { charger(); }, []);

  const ouvrir = (d) => { setOuvert(d); setImage(null); setLu(false); setCommentaire(''); setInfo(''); window.scrollTo?.(0, 0); };

  const signer = async () => {
    if (!image || !lu) return;
    setEnvoi(true);
    setErreur('');
    try {
      await signerDocument({ id: ouvert.id, image, consentement: true, contenuHash: ouvert.contenuHash, commentaire: commentaire.trim() });
      setOuvert(null);
      setInfo('Merci, votre signature a bien été enregistrée.');
      await charger();
    } catch (err) {
      setErreur(message(err));
    }
    setEnvoi(false);
  };

  if (ouvert) {
    const dejaSigne = Boolean(ouvert.signatures?.beneficiaire);
    return (
      <main className="page-content"><div style={styles.page}>
        <button type="button" onClick={() => setOuvert(null)} style={styles.boutonClair}>← Retour</button>
        <h2 style={{ margin: '12px 0 4px', fontSize: 20 }}>{ouvert.titre || TYPES[ouvert.type]}</h2>
        <p style={{ color: '#64748b', margin: '0 0 10px', fontSize: 14 }}>Reçu le {dateFr(ouvert.creeLe)}</p>
        <div style={styles.texte}>{ouvert.contenu}</div>
        {dejaSigne ? (
          <div style={{ ...styles.carte, borderColor: '#15803d' }}>
            <strong style={{ color: '#15803d' }}>✔ Vous avez signé ce document le {dateFr(ouvert.signatures.beneficiaire.signeLeIso)}.</strong>
            {ouvert.signatures.beneficiaire.commentaire ? <p style={{ fontSize: 14, fontStyle: 'italic', margin: '8px 0 0' }}>💬 « {ouvert.signatures.beneficiaire.commentaire} »</p> : null}
            {ouvert.signatures.beneficiaire.image ? <img src={ouvert.signatures.beneficiaire.image} alt="Votre signature" style={{ display: 'block', maxWidth: 220, marginTop: 8 }} /> : null}
            <p style={{ fontSize: 14, margin: '8px 0 0' }}>
              {(ouvert.signataires || []).filter((s) => s.role !== 'beneficiaire').map((s) => (ouvert.signatures?.[s.cle] ? `✔ ${s.nom} a signé le ${dateFr(ouvert.signatures[s.cle].signeLeIso)}` : `… En attente de la signature de ${s.nom}`)).join(' · ')}
            </p>
          </div>
        ) : (
          <div style={styles.carte}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, marginBottom: 12 }}>
              <input type="checkbox" checked={lu} onChange={(e) => setLu(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1 }} />
              <span>J'ai lu ce document en entier et je le signe électroniquement.</span>
            </label>
            {ouvert.type === 'evaluation' ? (
              <label style={{ display: 'block', fontSize: 15, marginBottom: 12 }}>
                💬 Mon commentaire (facultatif)
                <textarea rows={3} maxLength={1500} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ce que je pense de mon évaluation, ce que je veux travailler…"
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: 10, fontSize: 15, borderRadius: 10, border: '1px solid #cbd5e1', font: 'inherit' }} />
              </label>
            ) : null}
            <PaveSignature onChange={setImage} />
            {erreur ? <p style={{ color: '#b91c1c', fontSize: 14 }}>{erreur}</p> : null}
            <button type="button" disabled={!image || !lu || envoi} onClick={signer} style={{ ...styles.boutonPrincipal, opacity: !image || !lu || envoi ? 0.5 : 1 }}>
              {envoi ? 'Envoi…' : '✍️ Je signe'}
            </button>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
              Votre signature, la date et l'heure sont enregistrées avec le texte exact du document. Si vous avez une question, parlez-en à votre référent(e) avant de signer.
            </p>
          </div>
        )}
      </div></main>
    );
  }

  const aSigner = (docs || []).filter((d) => d.statut === 'en_attente' && !d.signatures?.beneficiaire);
  const autres = (docs || []).filter((d) => !aSigner.includes(d));
  const ligne = (d, attente) => (
    <button key={d.id} type="button" onClick={() => ouvrir(d)} style={{ ...styles.carte, ...styles.ligne, borderColor: attente ? '#b45309' : '#e2e8f0' }}>
      <span style={{ fontSize: 26 }}>{attente ? '✍️' : d.statut === 'signe' ? '✔' : '⏳'}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>
        <strong style={{ display: 'block', fontSize: 16 }}>{d.titre || TYPES[d.type]}</strong>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {attente ? `À signer · reçu le ${dateFr(d.creeLe)}` : d.statut === 'signe' ? 'Signé par tout le monde' : 'Vous avez signé · en attente de votre référent(e)'}
        </span>
      </span>
      <span style={{ color: '#94a3b8' }}>›</span>
    </button>
  );

  return (
    <main className="page-content">
      <div className="page-header">
        <h1>Documents à signer</h1>
        <p>Contrat d'engagement, évaluations de vos compétences</p>
      </div>
      <div style={styles.page}>
      {info ? <p style={{ color: '#15803d', fontWeight: 600 }}>{info}</p> : null}
      {erreur ? <p style={{ color: '#b91c1c' }}>{erreur}</p> : null}
      {docs === null ? <p>Chargement…</p> : null}
      {docs && !docs.length ? <p style={{ color: '#64748b' }}>Aucun document pour le moment.</p> : null}
      {aSigner.map((d) => ligne(d, true))}
      {autres.length ? <h3 style={{ fontSize: 15, color: '#475569', margin: '18px 0 6px' }}>Déjà signés</h3> : null}
      {autres.map((d) => ligne(d, false))}
      </div>
    </main>
  );
}

const styles = {
  page: { padding: 16, maxWidth: 640, margin: '0 auto' },
  carte: { border: '2px solid #e2e8f0', borderRadius: 14, padding: 14, background: '#fff', marginTop: 12, width: '100%', boxSizing: 'border-box' },
  ligne: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', font: 'inherit', color: 'inherit' },
  texte: { whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, maxHeight: '45vh', overflowY: 'auto' },
  boutonPrincipal: { width: '100%', marginTop: 14, padding: '14px 16px', fontSize: 17, fontWeight: 700, color: '#fff', background: '#0e4bb7', border: 'none', borderRadius: 12 },
  boutonClair: { padding: '6px 12px', fontSize: 14, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10 },
};
