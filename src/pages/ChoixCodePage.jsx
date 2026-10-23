import React, { useState } from 'react';
import { changerCode, seDeconnecter, messageErreur } from '../firebase.js';

function erreurCode(code) {
  if (code.length < 8) return 'Votre code doit contenir au moins 8 caractères.';
  if (!/[A-Za-zÀ-ÿ]/.test(code) || !/[0-9]/.test(code)) return 'Votre code doit contenir au moins une lettre et un chiffre.';
  if (code.toUpperCase() === 'PCGI87!') return 'Merci de choisir un code différent du code par défaut.';
  return '';
}

export default function ChoixCodePage({ obligatoire, onTermine, onAnnuler }) {
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function valider(e) {
    e.preventDefault();
    setErreur('');
    const c = code.trim();
    const probleme = erreurCode(c);
    if (probleme) { setErreur(probleme); return; }
    if (c !== confirmation.trim()) { setErreur('Les deux codes ne sont pas identiques.'); return; }
    setEnCours(true);
    try {
      await changerCode(c);
      onTermine?.();
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible d\'enregistrer votre code. Vérifiez votre connexion et réessayez.'));
      setEnCours(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-logo">
        <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: 88, height: 88, marginBottom: 14, borderRadius: 18 }} />
        <h1>{obligatoire ? 'Bienvenue' : 'Changer mon code'}</h1>
        <p>Choisissez votre code personnel</p>
      </div>

      <div className="login-card">
        <div className="login-hint">
          {obligatoire
            ? 'Pour protéger votre espace, choisissez maintenant votre propre code. Le code donné par votre référent(e) ne fonctionnera plus.'
            : 'Votre nouveau code remplacera l\'ancien.'}
          <br />
          <strong>Au moins 8 caractères, avec des lettres et au moins un chiffre.</strong>
          {' '}Exemple de forme : un mot que vous retenez facilement + des chiffres.
        </div>

        {erreur ? <div className="error-box" role="alert">{erreur}</div> : null}

        <form onSubmit={valider} noValidate>
          <div className="form-field">
            <label htmlFor="nouveau">Nouveau code</label>
            <input id="nouveau" type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="new-password" maxLength={64} autoFocus />
          </div>
          <div className="form-field">
            <label htmlFor="confirmation">Retapez le code</label>
            <input id="confirmation" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" maxLength={64} />
          </div>
          <button className="btn btn-primary mt-8" type="submit" disabled={enCours}>
            {enCours ? 'Enregistrement…' : 'Valider mon code'}
          </button>
        </form>

        <div className="liens-connexion">
          {obligatoire ? (
            <button type="button" className="lien" onClick={() => seDeconnecter()}>Se déconnecter</button>
          ) : (
            <button type="button" className="lien" onClick={onAnnuler}>← Annuler</button>
          )}
        </div>
        <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: 12 }}>
          Ne communiquez votre code à personne. Votre référent(e) ne vous le demandera jamais.
        </p>
      </div>
    </div>
  );
}
