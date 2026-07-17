import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import AccueilPage from './pages/AccueilPage.jsx';
import AgendaPage from './pages/AgendaPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import ProfilPage from './pages/ProfilPage.jsx';
import BottomNav from './components/BottomNav.jsx';
import { load, save, STORAGE_KEYS, DEMO_BEN } from './utils/storage.js';
import { initFCM, onFCMMessage } from './fcm-service.js';

function Splash() {
  return (
    <div className="splash">
      <h1>🌿 Mon Espace</h1>
      <p>PCGI 87</p>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} className="splash-dot" style={{ animationDelay: `${delay}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [splash, setSplash] = useState(true);
  const [ben, setBen] = useState(null);
  const [page, setPage] = useState('accueil');

  // Splash + restore session
  useEffect(() => {
    const timer = setTimeout(() => {
      const session = load(STORAGE_KEYS.session, null);
      if (session && session.benId) {
        // Tenter de recharger le bénéficiaire depuis le storage principal
        const allBenefs = load(STORAGE_KEYS.beneficiaires, {});
        const structBenefs = allBenefs[session.structureId] || [];
        const found = structBenefs.find(b => b.id === session.benId);
        if (found) {
          setBen({ ...found, structureId: session.structureId });
        } else if (session.benId === 'demo_001') {
          setBen({ ...DEMO_BEN, structureId: session.structureId });
        }
      }
      setSplash(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  function handleLogin(beneficiaire) {
    setBen(beneficiaire);
    setPage('accueil');
    // Initialiser FCM pour les notifications
    initFCM().catch(err => console.error('FCM init error:', err));
  }

  function handleLogout() {
    setBen(null);
    setPage('accueil');
  }

  // Écouter les messages FCM
  useEffect(() => {
    if (ben) {
      onFCMMessage((payload) => {
        console.log('📬 Nouvelle notification:', payload.notification.title);
        // Afficher une notification visuelle si souhaité
      });
    }
  }, [ben]);

  if (splash) return <Splash />;

  if (!ben) return <LoginPage onLogin={handleLogin} />;

  function renderPage() {
    switch (page) {
      case 'accueil':   return <AccueilPage   ben={ben} onNavigate={setPage} />;
      case 'agenda':    return <AgendaPage     ben={ben} />;
      case 'messages':  return <MessagesPage   ben={ben} />;
      case 'documents': return <DocumentsPage  ben={ben} />;
      case 'profil':    return <ProfilPage     ben={ben} onLogout={handleLogout} onNavigate={setPage} />;
      default:          return <AccueilPage    ben={ben} onNavigate={setPage} />;
    }
  }

  return (
    <div className="app-root">
      {renderPage()}
      <BottomNav active={page} onChange={setPage} ben={ben} />
    </div>
  );
}
