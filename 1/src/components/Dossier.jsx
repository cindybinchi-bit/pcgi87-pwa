import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config.js'

const ETAPES = [
  { id: 1, label: 'Inscription', icon: '✅' },
  { id: 2, label: 'Diagnostic', icon: '🔍' },
  { id: 3, label: 'Plan d\'action', icon: '📝' },
  { id: 4, label: 'Accompagnement', icon: '🤝' },
  { id: 5, label: 'Insertion', icon: '🎯' },
]

export default function Dossier({ user }) {
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const ref = doc(db, 'beneficiaires', user.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) setDossier(snap.data())
      } catch (e) {}
      setLoading(false)
    }
    fetch()
  }, [user.uid])

  const etapeActuelle = dossier?.etape || 2

  if (loading) return <Skeleton />

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Mon dossier</h3>
      <p style={{ color: 'var(--gris)', fontSize: 13, marginBottom: 28 }}>
        Suivi de votre parcours d'insertion
      </p>

      {/* Référent */}
      <div style={{
        background: 'var(--bleu-clair)', borderRadius: 12, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28
      }}>
        <span style={{ fontSize: 28 }}>👩‍💼</span>
        <div>
          <p style={{ fontSize: 12, color: 'var(--bleu)', fontWeight: 600, marginBottom: 2 }}>Votre référent</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{dossier?.referent || 'Non assigné'}</p>
          {dossier?.referentContact && (
            <p style={{ fontSize: 12, color: 'var(--gris)' }}>{dossier.referentContact}</p>
          )}
        </div>
      </div>

      {/* Étapes */}
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Progression
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ETAPES.map((e, i) => {
          const done = e.id < etapeActuelle
          const current = e.id === etapeActuelle
          return (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 10,
              background: current ? 'var(--bleu)' : done ? 'var(--vert-clair)' : 'var(--gris-clair)',
              border: current ? 'none' : done ? '1px solid #9ae6b4' : '1px solid var(--bord)'
            }}>
              <span style={{ fontSize: 20 }}>
                {done ? '✅' : current ? '🔵' : '⭕'}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: 14, fontWeight: current ? 700 : 500,
                  color: current ? '#fff' : done ? 'var(--vert)' : 'var(--gris)'
                }}>
                  {e.label}
                </p>
              </div>
              {current && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)', color: '#fff',
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20
                }}>En cours</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Prochain RDV */}
      {dossier?.prochainRdv && (
        <div style={{
          marginTop: 24, background: 'var(--vert-clair)', border: '1px solid #9ae6b4',
          borderRadius: 12, padding: '14px 16px'
        }}>
          <p style={{ fontSize: 12, color: 'var(--vert)', fontWeight: 600, marginBottom: 4 }}>
            📅 Prochain rendez-vous
          </p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{dossier.prochainRdv}</p>
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ padding: 24 }}>
      {[100, 60, 80, 60, 80].map((w, i) => (
        <div key={i} style={{
          height: 16, width: `${w}%`, background: '#e2e8f0',
          borderRadius: 8, marginBottom: 16, animation: 'pulse 1.5s infinite'
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
