import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { listeStructures, seConnecter, demanderNouveauCode, messageErreur } from '../firebase.js';
import { STRUCTURES_PAR_DEFAUT } from '../utils.js';

function lireInvitation() {
  try {
    const p = new URLSearchParams(window.location.search);
    const structId = p.get('structId');
    return structId && /^[A-Za-z0-9_-]+$/.test(structId) ? structId : null;
  } catch {
    return null;
  }
}

export default function ConnexionPage({ avis, onAvisLu, onConfidentialite }) {
  const invitation = lireInvitation();
  const [structures, setStructures] = useState(STRUCTURES_PAR_DEFAUT);
  const [structureId, setStructureId] = useState(invitation || STRUCTURES_PAR_DEFAUT[0].id);
  const [nomComplet, setNomComplet] = useState('');
  const [code, setCode] = useState('');
  const [voirCode, setVoirCode] = useState(false);
  const [resterConnecte, setResterConnecte] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [modeOubli, setModeOubli] = useState(false);

  useEffect(() => {
    listeStructures()
      .then((r) => { if (r?.structures?.length) setStructures(r.structures); })
      .catch(() => { /* liste par défaut */ });
  }, []);

  useEffect(() => {
    if (invitation) {
      // Retire les paramètres de l'adresse (ils ne doivent pas rester dans l'historique)
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [invitation]);

  async function connexion(e) {
    e.preventDefault();
    setErreur('');
    setInfo('');
    onAvisLu?.();
    if (!nomComplet.trim() || !code.trim()) {
      setErreur('Indiquez votre nom, votre prénom et votre code d\'accès.');
      return;
    }
    setEnCours(true);
    try {
      await seConnecter({ structureId, nomComplet: nomComplet.trim(), code: code.trim(), resterConnecte });
      setCode('');
    } catch (err) {
      setErreur(messageErreur(err, 'Connexion impossible pour le moment. Réessayez dans un instant.'));
      setEnCours(false);
    }
  }

  async function demandeOubli(e) {
    e.preventDefault();
    setErreur('');
    if (!nomComplet.trim()) {
      setErreur('Indiquez votre nom et votre prénom.');
      return;
    }
    setEnCours(true);
    try {
      await demanderNouveauCode(structureId, nomComplet.trim());
      setInfo('Votre demande a été transmise à votre structure. Votre référent(e) vous donnera un nouveau code.');
      setModeOubli(false);
    } catch (err) {
      setErreur(messageErreur(err));
    }
    setEnCours(false);
  }

  return (
    <div className="login-screen">
      <div className="login-logo">
        <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: 100, height: 100, marginBottom: 14, borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }} />
        <h1>Mon Espace</h1>
        <p>Portail bénéficiaire · PCGI 87</p>
      </div>

      <div className="login-card">
        <div className="login-hint">
          {modeOubli
            ? 'Indiquez votre structure et votre nom : votre référent(e) sera prévenu(e) et vous donnera un nouveau code.'
            : 'Connectez-vous avec votre nom et le code donné par votre référent(e).'}
        </div>

        {avis ? <div className="error-box" role="alert">{avis}</div> : null}
        {erreur ? <div className="error-box" role="alert">{erreur}</div> : null}
        {info ? <div className="info-box" role="status">{info}</div> : null}

        <form onSubmit={modeOubli ? demandeOubli : connexion} noValidate>
          <div className="form-field">
            <label htmlFor="structure">Votre structure</label>
            <select id="structure" value={structureId} onChange={(e) => setStructureId(e.target.value)} disabled={Boolean(invitation)}>
              {structures.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="nom">Prénom et nom</label>
            <input
              id="nom"
              type="text"
              placeholder="Ex : Sophie Martin"
              value={nomComplet}
              onChange={(e) => setNomComplet(e.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              maxLength={120}
            />
          </div>

          {!modeOubli ? (
            <>
              <div className="form-field">
                <label htmlFor="code">Code d'accès</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="code"
                    type={voirCode ? 'text' : 'password'}
                    placeholder="Votre code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="current-password"
                    maxLength={64}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-ghost" onClick={() => setVoirCode((v) => !v)} aria-pressed={voirCode} style={{ padding: '0 12px' }}>
                    {voirCode ? 'Masquer' : 'Voir'}
                  </button>
                </div>
              </div>

              <label className="case-a-cocher">
                <input type="checkbox" checked={resterConnecte} onChange={(e) => setResterConnecte(e.target.checked)} />
                <span>
                  Rester connecté(e) sur ce téléphone
                  <small>À ne pas cocher sur un téléphone partagé ou prêté.</small>
                </span>
              </label>
            </>
          ) : null}

          <button className="btn btn-primary mt-8" type="submit" disabled={enCours}>
            {enCours ? 'Patientez…' : (modeOubli ? 'Prévenir mon référent(e)' : 'Se connecter')}
          </button>
        </form>

        <div className="liens-connexion">
          <button type="button" className="lien" onClick={() => { setModeOubli((v) => !v); setErreur(''); setInfo(''); }}>
            {modeOubli ? '← Retour à la connexion' : 'J\'ai oublié mon code'}
          </button>
          <button type="button" className="lien" onClick={onConfidentialite}>
            <ShieldCheck size={14} aria-hidden="true" /> Vos données personnelles
          </button>
        </div>
      </div>
    </div>
  );
}
