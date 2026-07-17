import React, { useState } from 'react';
import { updateBeneficiaryAccessCode } from '../firebase-service.js';
import { save, STORAGE_KEYS } from '../utils/storage.js';

export default function ChangePasswordPage({ ben, onPasswordChanged }) {
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newCode.trim().length < 6) {
      setError('Votre code doit contenir au moins 6 caractères.');
      return;
    }
    if (newCode !== confirmCode) {
      setError('Les deux codes ne correspondent pas.');
      return;
    }
    if (newCode === 'PCGI87!') {
      setError('Merci de choisir un code différent du code par défaut.');
      return;
    }

    setLoading(true);
    try {
      await updateBeneficiaryAccessCode(ben.structureId, ben.id, newCode.trim());

      // Mettre à jour la session locale pour refléter le nouveau code
      const updatedBen = { ...ben, accessCode: newCode.trim(), firstLogin: false };
      save(STORAGE_KEYS.session, {
        benId: ben.id,
        structureId: ben.structureId,
        nom: ben.nom,
        prenom: ben.prenom,
        ts: Date.now(),
      });

      onPasswordChanged(updatedBen);
    } catch (err) {
      console.error('Erreur changement de code:', err);
      setError("Impossible de mettre à jour votre code. Vérifiez votre connexion internet et réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-logo">
        <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: '92px', height: '92px', marginBottom: '14px', borderRadius: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }} />
        <h1>Bienvenue</h1>
        <p>Choisissez votre code d'accès personnel</p>
      </div>

      <div className="login-card">
        <div className="login-hint">
          👋 Bonjour {ben.prenom} ! C'est votre première connexion.<br />
          Pour sécuriser votre espace, choisissez un code d'accès personnel
          (différent du code temporaire fourni par votre référent).
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="newCode">Nouveau code d'accès</label>
            <input
              id="newCode"
              type="password"
              placeholder="Au moins 6 caractères"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="confirmCode">Confirmer le code</label>
            <input
              id="confirmCode"
              type="password"
              placeholder="Retapez votre code"
              value={confirmCode}
              onChange={e => setConfirmCode(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button className="btn btn-primary mt-8" type="submit" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Valider mon code →'}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center', marginTop: 16 }}>
          Ce code vous servira à vous connecter la prochaine fois.<br />
          Gardez-le précieusement, lui seul vous donne accès à votre espace.
        </p>
      </div>
    </div>
  );
}
