import React, { useState } from 'react';
import { load, save, STORAGE_KEYS, STRUCTURE_NAMES } from '../utils/storage.js';
import { getBeneficiaries, initFirebase } from '../firebase-service.js';

export default function LoginPage({ onLogin }) {
  const [structureId, setStructureId] = useState('struct_001');
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
            <label>Code d acces</label>
            <input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="Code fourni par votre referent" required />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>Code par defaut : PCGI87! - Contactez votre referent(e) en cas de probleme.</p>
      </div>
    </div>
  );
}
