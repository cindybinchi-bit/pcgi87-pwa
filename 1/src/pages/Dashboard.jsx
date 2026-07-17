import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config.js'
import Dossier from '../components/Dossier.jsx'
import Documents from '../components/Documents.jsx'
import Messagerie from '../components/Messagerie.jsx'

const TABS = [
  { id: 'dossier', label: 'Mon dossier', icon: '📋' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'messagerie', label: 'Messagerie', icon: '💬' },
]

export default function Dashboard({ user }) {
  const [tab, setTab] = useState('dossier')

  const handleLogout = () => signOut(auth)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gris-clair)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bleu)', padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏛️</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>PCGI 87</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=3b6fd4&color=fff`}
            alt="avatar"
            style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)' }}
          />
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', padding: '6px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 500
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #0e4bb7 0%, #3b6fd4 100%)',
        padding: '24px 20px 48px', marginBottom: -24
      }}>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 }}>Bonjour,</p>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
          {user.displayName?.split(' ')[0] || 'Bénéficiaire'} 👋
        </h2>
      </div>

      {/* Main content */}
      <main style={{ padding: '0 16px 100px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{
          background: '#fff', borderRadius: 16, overflow: 'hidden',
          boxShadow: 'var(--shadow)', marginBottom: 20
        }}>
          {tab === 'dossier' && <Dossier user={user} />}
          {tab === 'documents' && <Documents user={user} />}
          {tab === 'messagerie' && <Messagerie user={user} />}
        </div>
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid var(--bord)',
        display: 'flex', padding: '8px 0 env(safe-area-inset-bottom)',
        zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, border: 'none', background: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 0', color: tab === t.id ? 'var(--bleu)' : 'var(--gris)',
              fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
              transition: 'color 0.2s'
            }}
          >
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
