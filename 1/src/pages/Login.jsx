import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config.js'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      setError('Connexion impossible. Vérifiez votre compte Google.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'linear-gradient(135deg, #0e4bb7 0%, #3b6fd4 100%)',
      padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 40px',
        width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 72, background: 'var(--bleu-clair)', borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 32
        }}>🏛️</div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--bleu)', marginBottom: 8 }}>
          Mon Espace — PCGI 87
        </h1>
        <p style={{ color: 'var(--gris)', fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
          Plateforme de coordination globale<br />de l'insertion
        </p>

        {error && (
          <div style={{
            background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8,
            padding: '10px 14px', marginBottom: 20, color: 'var(--rouge)', fontSize: 13
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 20px', border: '2px solid var(--bord)',
            borderRadius: 12, background: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 15, fontWeight: 600, color: 'var(--texte)',
            transition: 'all 0.2s', opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--bleu)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bord)'}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          </svg>
          {loading ? 'Connexion…' : 'Continuer avec Google'}
        </button>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--gris)' }}>
          Accès réservé aux bénéficiaires PCGI 87
        </p>
      </div>
    </div>
  )
}
