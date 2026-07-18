import React, { useState } from 'react';
import { load, save, STORAGE_KEYS, STRUCTURE_NAMES } from '../utils/storage.js';
import { getBeneficiaries, initFirebase, requestCodeReminder } from '../firebase-service.js';

export default function LoginPage({ onLogin }) {
  const [structureId, setStructureId] = useState('struct_001');
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotNom, setForgotNom] = useState('');
  const [forgotStructure, setForgotStructure] = useState('struct_001');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!nom.trim() || !code.trim()) {
      setError("Veuillez renseigner votre nom et votre code d'acces.");
      return;
    }
    setLoading(true);
    try {
      await initFirebase();
      let list = [];
      try {
        list = await getBeneficiaries(structureId);
      } catch (err) {
        const allBenefs = load(STORAGE_KEYS.beneficiaires, {});
        list = allBenefs[structureId] || [];
      }
      const input = nom.trim().toLowerCase();
      const inputCode = code.trim();
      const found = list.find(b => {
        const validCode = (b.accessCode || 'PCGI87!') === inputCode;
        if (!validCode) return false;
        const fullNomPrenom = ((b.nom || '') + ' ' + (b.prenom || '')).trim().toLowerCase();
        const fullPrenomNom = ((b.prenom || '') + ' ' + (b.nom || '')).trim().toLowerCase();
        const nomSeul = (b.nom || '').trim().toLowerCase();
        const prenomSeul = (b.prenom || '').trim().toLowerCase();
        const emailB = (b.email || '').trim().toLowerCase();
        return input === fullNomPrenom || input === fullPrenomNom || input === nomSeul || input === prenomSeul || (emailB && input === emailB);
      });
      if (!found) {
        setError("Identifiants incorrects. Essayez votre nom seul, prenom seul, ou prenom+nom. Code par defaut : PCGI87!");
        setLoading(false);
        return;
      }
      save(STORAGE_KEYS.session, { benId: found.id, structureId, nom: found.nom, prenom: found.prenom, ts: Date.now() });
      onLogin({ ...found, structureId });
      setLoading(false);
    } catch (err) {
      setError("Erreur de connexion. Verifiez votre nom et code.");
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setForgotError('');
    if (!forgotNom.trim()) {
      setForgotError("Veuillez entrer votre nom.");
      return;
    }
    setForgotLoading(true);
    try {
      await initFirebase();
      await requestCodeReminder(forgotStructure, forgotNom.trim());
      setForgotSent(true);
    } catch (err) {
      setForgotError("Erreur lors de l'envoi. Reessayez ou contactez votre referent(e).");
    }
    setForgotLoading(false);
  }

  if (showForgot) {
    return (
      <div className="login-screen">
        <div className="login-logo">
          <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: '108px', height: '108px', marginBottom: '14px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }} />
          <h1>Mon Espace</h1>
          <p>Portail beneficiaire - PCGI 87</p>
        </div>
        <div className="login-card">
          {forgotSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>OK</div>
              <h3 style={{ marginBottom: 8 }}>Demande envoyee !</h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: 20 }}>
                Votre referent(e) a ete notifie(e) et vous communiquera votre code d'acces prochainement.
              </p>
              <button className="btn-login" onClick={() => { setShowForgot(false); setForgotSent(false); setForgotNom(''); }}>
                Retour a la connexion
              </button>
            </div>
          ) : (
            <>
              <div className="login-hint">Entrez votre nom pour que votre referent(e) soit notifie(e) et vous transmette votre code.</div>
              {forgotError && <div className="error-box">{forgotError}</div>}
              <form onSubmit={handleForgot}>
                <div className="field-group">
                  <label>Votre structure</label>
                  <select value={forgotStructure} onChange={e => setForgotStructure(e.target.value)}>
                    {Object.entries(STRUCTURE_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Votre nom et prenom</label>
                  <input type="text" value={forgotNom} onChange={e => setForgotNom(e.target.value)} placeholder="Ex : Sophie Martin" required />
                </div>
                <button type="submit" className="btn-login" disabled={forgotLoading}>
                  {forgotLoading ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </form>
              <button onClick={() => setShowForgot(false)} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.88rem' }}>
                Retour a la connexion
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-logo">
        <img src="/pcgi-logo.jpg" alt="PCGI 87" style={{ width: '108px', height: '108px', marginBottom: '14px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }} />
        <h1>Mon Espace</h1>
        <p>Portail beneficiaire - PCGI 87</p>
      </div>
      <div className="login-card">
        <div className="login-hint">Connectez-vous avec les identifiants fournis par votre referent(e).</div>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Votre structure</label>
            <select value={structureId} onChange={e => setStructureId(e.target.value)}>
              {Object.entries(STRUCTURE_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Nom et prenom</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Sophie Martin" required />
          </div>
          <div className="field-group">
            <label>Code d'acces</label>
            <input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="Code fourni par votre referent" required />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>
        <button onClick={() => setShowForgot(true)} style={{ width: '100%', marginTop: 14, background: 'none', border: 'none', color: '#0e4bb7', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
          Code oublie ? Contacter mon referent(e)
        </button>
        <p style={{ marginTop: 10, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>Code par defaut : PCGI87!</p>
      </div>
    </div>
  );
}
