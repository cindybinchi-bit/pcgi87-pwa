import React from 'react';

export default function Chargement({ texte = 'PCGI 87' }) {
  return (
    <div className="splash" role="status" aria-live="polite">
      <img
        src="/pcgi-logo.jpg"
        alt=""
        style={{ width: 88, height: 88, borderRadius: 18, marginBottom: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
      />
      <h1>Mon Espace</h1>
      <p>{texte}</p>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }} aria-hidden="true">
        {[0, 0.2, 0.4].map((delay) => (
          <div key={delay} className="splash-dot" style={{ animationDelay: `${delay}s` }} />
        ))}
      </div>
    </div>
  );
}
