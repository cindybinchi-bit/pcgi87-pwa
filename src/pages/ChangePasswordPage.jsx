import React, { useState } from 'react';
import { save, STORAGE_KEYS } from '../utils/storage.js';
import { updateBeneficiaryCode } from '../firebase-service.js';

export default function ChangePasswordPage({ ben, onBack }) {
  const [current, setCurrent] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setMsg('');
    if ((ben.accessCode || 'PCGI87!') !== current) {
      setError('Code actuel incorrect.');
      return;
    }
    if (newCode.length < 6) {
      setError('Le nouveau code doit contenir au moins 6 caracteres.');
      return;
    }
    if (newCode !== confirm) {
      setError('Les codes ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await updateBeneficiaryCode(ben.structureId, ben.id, newCode);
      const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || '{}');
      save(STORAGE_KEYS.session, { ...session, accessCode: newCode });
      setMsg('Code modifie avec succes !');
      setCurrent(''); setNewCode(''); setConfirm('');
    } catch (err) {
      setError('Erreur lors de la modification. Reessayez.');
    }
    setLoading(false);
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue-700)', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}>
          &larr; Retour
        </button>
        <h1>Changer mon code</h1>
        <p>Choisissez un code personnel securise</p>
      </div>
      <div className="card" style={{ maxWidth: 400, margin: '24px auto' }}>
        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontWeight: 600 }}>{msg}</div>}
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Code actuel</label>
            <input type="password" value={current} onChange={e => setCurrent(e.target.value)}
              placeholder="Votre code actuel" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '0.95rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Nouveau code</label>
            <input type="password" value={newCode} onChange={e => setNewCode(e.target.value)}
              placeholder="Minimum 6 caracteres" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '0.95rem' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>Confirmer le nouveau code</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repetez le nouveau code" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '0.95rem' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: 'var(--blue-700)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            {loading ? 'Modification...' : 'Modifier mon code'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Le code par defaut est PCGI87! — Choisissez un code personnel que vous seul connaissez.
        </p>
      </div>
    </div>
  );
}
