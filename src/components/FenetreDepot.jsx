import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import { CATEGORIES_DEPOT, ACCEPT_DEPOT, deposerDocument, verifierFichier } from '../donnees.js';

function taille(o) {
  if (o < 1024 * 1024) return `${Math.max(1, Math.round(o / 1024))} Ko`;
  return `${(o / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

/**
 * Fenêtre « Envoyer un document » (en bas de l'écran).
 * - fichierInitial : fichier déjà choisi (glisser-déposer ou trombone), sinon on propose de le choisir.
 */
export default function FenetreDepot({ fiche, structureId, fichierInitial = null, onFerme, onEnvoye }) {
  const [fichier, setFichier] = useState(fichierInitial);
  const [categorie, setCategorie] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [progression, setProgression] = useState(null);
  const [erreur, setErreur] = useState(fichierInitial ? verifierFichier(fichierInitial) : '');
  const [apercu, setApercu] = useState('');
  const choix = useRef(null);
  const photo = useRef(null);

  useEffect(() => {
    if (!fichier || !/^image\/(jpeg|png|webp)$/.test(fichier.type)) { setApercu(''); return undefined; }
    const url = URL.createObjectURL(fichier);
    setApercu(url);
    return () => URL.revokeObjectURL(url);
  }, [fichier]);

  useEffect(() => {
    const echap = (e) => { if (e.key === 'Escape' && progression === null) onFerme?.(); };
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFerme, progression]);

  function choisir(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setFichier(f);
    setErreur(verifierFichier(f));
  }

  async function envoyer() {
    if (!fichier || progression !== null) return;
    const probleme = verifierFichier(fichier);
    if (probleme) { setErreur(probleme); return; }
    if (!categorie) { setErreur('Choisissez le type de document.'); return; }
    setErreur('');
    setProgression(0);
    try {
      await deposerDocument({ fiche, structureId, fichier, categorie, commentaire, onProgression: setProgression });
      onEnvoye?.(fichier.name);
    } catch (err) {
      const code = String(err?.code || '');
      setErreur(
        code.includes('unauthorized') ? 'Envoi refusé. Contactez votre référent(e).'
          : code.includes('canceled') ? 'Envoi annulé.'
            : (err?.message && !code ? err.message : 'Le document n\'a pas pu être envoyé. Vérifiez votre connexion et réessayez.'),
      );
      setProgression(null);
    }
  }

  const enCours = progression !== null;
  const Icone = fichier && /^image\//.test(fichier.type) ? ImageIcon : FileText;

  return (
    <div className="depot-voile" role="presentation" onClick={() => { if (!enCours) onFerme?.(); }}>
      <div className="depot-fenetre" role="dialog" aria-modal="true" aria-labelledby="depot-titre" onClick={(e) => e.stopPropagation()}>
        <div className="depot-entete">
          <h2 id="depot-titre">Envoyer un document</h2>
          <button type="button" className="depot-fermer" onClick={onFerme} disabled={enCours} aria-label="Fermer">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <input ref={choix} type="file" accept={ACCEPT_DEPOT} onChange={choisir} hidden />
        <input ref={photo} type="file" accept="image/*" capture="environment" onChange={choisir} hidden />

        {!fichier ? (
          <div className="depot-choix">
            <button type="button" className="btn btn-secondary" onClick={() => photo.current?.click()}>
              📷 Prendre une photo
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => choix.current?.click()}>
              📁 Choisir un fichier
            </button>
            <p className="depot-aide">Photo, PDF ou document Word · 15 Mo maximum</p>
          </div>
        ) : (
          <div className="depot-fichier">
            {apercu ? <img src={apercu} alt="" /> : <span className="depot-fichier-icone"><Icone size={22} aria-hidden="true" /></span>}
            <span className="depot-fichier-nom">
              <strong>{fichier.name}</strong>
              <small>{taille(fichier.size)}</small>
            </span>
            {!enCours ? (
              <button type="button" className="lien" onClick={() => choix.current?.click()}>Changer</button>
            ) : null}
          </div>
        )}

        {fichier ? (
          <>
            <div className="form-field">
              <label htmlFor="depot-categorie">Type de document</label>
              <select id="depot-categorie" value={categorie} onChange={(e) => { setCategorie(e.target.value); setErreur(''); }} disabled={enCours}>
                <option value="">— Choisir —</option>
                {CATEGORIES_DEPOT.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="depot-commentaire">Message pour votre référent(e) <small>(facultatif)</small></label>
              <textarea id="depot-commentaire" rows={2} maxLength={500} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} disabled={enCours} placeholder="Ex : ma nouvelle attestation CAF" />
            </div>
          </>
        ) : null}

        {erreur ? <div className="error-box" role="alert">{erreur}</div> : null}

        {enCours ? (
          <div className="depot-progression" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progression}>
            <span style={{ width: `${progression}%` }} />
            <small>Envoi en cours… {progression} %</small>
          </div>
        ) : null}

        {fichier ? (
          <button type="button" className="btn btn-primary" onClick={envoyer} disabled={enCours || Boolean(verifierFichier(fichier))}>
            <Upload size={18} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 6 }} />
            {enCours ? 'Envoi…' : 'Envoyer à mon référent(e)'}
          </button>
        ) : null}

        <p className="depot-aide" style={{ marginTop: 10 }}>
          🔒 Le document est transmis uniquement à votre structure.
        </p>
      </div>
    </div>
  );
}
