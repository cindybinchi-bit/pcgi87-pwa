import React, { useState, useEffect } from 'react';
import { load, save, STORAGE_KEYS, STRUCTURE_NAMES, DEMO_BEN } from './storage.js';
import { getBeneficiaries, initFirebase } from './firebase-service.js';

export default function LoginPage({ onLogin }) {
  const [structureId, setStructureId] = useState('struct_001');
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState(false);
  const [inviteBeneficiaryId, setInviteBeneficiaryId] = useState(null);

  // Détecter un lien d'invitation dans l'URL : ?invite=xxx&benId=yyy&structId=zzz
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const benId = params.get('benId');
    const structId = params.get('structId');
    const inviteId = params.get('invite');

    if (inviteId && benId && structId) {
      setStructureId(structId);
      setInviteBeneficiaryId(benId);
      setInviteMode(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!nom.trim() || !code.trim()) {
      setError('Veuillez renseigner votre nom et votre code d\'accès.');
      return;
    }
    setLoading(true);

    try {
      // Initialiser Firebase
      await initFirebase();

      // Charger les bénéficiaires depuis Firebase
      let list = [];
      try {
        list = await getBeneficiaries(structureId);
      } catch (err) {
        console.warn('Firebase non disponible, chargement depuis localStorage', err);
        const allBenefs = load(STORAGE_KEYS.beneficiaires, {});
        list = allBenefs[structureId] || [];
      }

      let found = list.find(b => {
        const full = `${b.prenom || ''} ${b.nom || ''}`.trim().toLowerCase();
        return full === nom.trim().toLowerCase() && (b.accessCode || 'PCGI87!') === code.trim();
      });

      if (!found && code.trim() === 'PCGI87!') {
        // Mode démo
        found = { ...DEMO_BEN, structureId };
      }

      if (!found) {
        setError('Identifiants incorrects. Contactez votre référent(e) si vous avez oublié votre code.');
        setLoading(false);
        return;
      }

      const session = { benId: found.id, structureId, nom: found.nom, prenom: found.prenom, ts: Date.now() };
      save(STORAGE_KEYS.session, session);
      onLogin({ ...found, structureId });
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError('Erreur de connexion. Vérifiez votre nom et code.');
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-logo">
        <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: '120px', height: '120px', marginBottom: '16px', borderRadius: '12px' }} />
        <h1>🌿 Mon Espace</h1>
        <p>Portail bénéficiaire · PCGI 87</p>
      </div>

      <div className="login-card">
        {inviteMode ? (
          <div className="login-hint">
            🎉 Vous avez été invité(e) à rejoindre votre espace personnel !<br />
            Connectez-vous avec le <strong>code temporaire</strong> fourni par votre référent(e),
            vous pourrez ensuite choisir votre propre code.
          </div>
        ) : (
          <div className="login-hint">
            💡 Connectez-vous avec les identifiants fournis par votre référent(e).
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="struct">Votre structure</label>
            <select
              id="struct"
              value={structureId}
              onChange={e => setStructureId(e.target.value)}
              disabled={inviteMode}
            >
              {Object.entries(STRUCTURE_NAMES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="nom">Nom et prénom</label>
            <input
              id="nom"
              type="text"
              placeholder="Ex : Sophie Martin"
              value={nom}
              onChange={e => setNom(e.target.value)}
              autoComplete="name"
              autoCapitalize="words"
            />
          </div>

          <div className="form-field">
            <label htmlFor="code">Code d'accès</label>
            <input
              id="code"
              type="password"
              placeholder="Code fourni par votre référent"
              value={code}
              onChange={e => setCode(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary mt-8" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>
        </form>

        {!inviteMode && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center', marginTop: 16 }}>
            Démo : entrez n'importe quel nom + code <strong>PCGI87!</strong>
          </p>
        )}
      </div>
    </div>
  );
}
