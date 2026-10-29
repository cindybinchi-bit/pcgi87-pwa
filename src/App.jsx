import React, { useEffect, useMemo, useState } from 'react';
import { suivreSession, seDeconnecter } from './firebase.js';
import { suivreFiche, suivreAgenda, suivreMessages } from './donnees.js';
import { nettoyerAnciennesDonnees } from './utils.js';
import Chargement from './components/Chargement.jsx';
import BarreNavigation from './components/BarreNavigation.jsx';
import ConnexionPage from './pages/ConnexionPage.jsx';
import ChoixCodePage from './pages/ChoixCodePage.jsx';
import AccueilPage from './pages/AccueilPage.jsx';
import AgendaPage from './pages/AgendaPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import ProfilPage from './pages/ProfilPage.jsx';
import ConfidentialitePage from './pages/ConfidentialitePage.jsx';
import SignaturesPage from './pages/SignaturesPage.jsx';
import { mesSignatures } from './firebase.js';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = vérification en cours
  const [page, setPage] = useState('accueil');
  const [fiche, setFiche] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagesCharges, setMessagesCharges] = useState(false);
  const [avisConnexion, setAvisConnexion] = useState('');
  const [voirConfidentialite, setVoirConfidentialite] = useState(false);
  const [changerCodeVolontaire, setChangerCodeVolontaire] = useState(false);
  const [aSigner, setASigner] = useState(0);

  useEffect(() => {
    nettoyerAnciennesDonnees();
    return suivreSession((s) => {
      setSession(s);
      if (!s) {
        setFiche(null);
        setAgenda([]);
        setMessages([]);
        setMessagesCharges(false);
        setPage('accueil');
      }
    });
  }, []);

  const pret = Boolean(session && !session.codeProvisoire);

  useEffect(() => {
    if (!pret) return undefined;
    const { structureId, benId } = session;
    const surErreur = (err) => {
      if (err?.code === 'permission-denied') {
        setAvisConnexion('Votre session a expiré. Merci de vous reconnecter.');
        seDeconnecter();
      }
    };
    const u1 = suivreFiche(structureId, benId, (f) => {
      if (f) setFiche(f);
      else {
        setAvisConnexion('Votre espace n\'est plus disponible. Contactez votre référent(e).');
        seDeconnecter();
      }
    }, surErreur);
    const u2 = suivreAgenda(structureId, benId, setAgenda, surErreur);
    const u3 = suivreMessages(benId, (list) => { setMessages(list); setMessagesCharges(true); }, surErreur);
    return () => { u1(); u2(); u3(); };
  }, [pret, session?.structureId, session?.benId]);

  // Documents en attente de ma signature (vérifié à l'ouverture, à chaque changement de page et toutes les 5 min)
  useEffect(() => {
    if (!pret) { setASigner(0); return undefined; }
    let actif = true;
    const verifier = () => mesSignatures()
      .then((r) => { if (actif) setASigner((r?.documents || []).filter((d) => d.statut === 'en_attente' && !d.signatures?.beneficiaire).length); })
      .catch(() => {});
    verifier();
    const minuteur = setInterval(verifier, 5 * 60 * 1000);
    return () => { actif = false; clearInterval(minuteur); };
  }, [pret, session?.benId, page]);

  const nonLus = useMemo(
    () => messages.filter((m) => m.authorType === 'professional' && !m.readAt).length,
    [messages],
  );

  if (session === undefined) return <Chargement />;

  if (voirConfidentialite) {
    return (
      <ConfidentialitePage
        structureId={session?.structureId}
        onRetour={() => setVoirConfidentialite(false)}
      />
    );
  }

  if (!session) {
    return (
      <ConnexionPage
        avis={avisConnexion}
        onAvisLu={() => setAvisConnexion('')}
        onConfidentialite={() => setVoirConfidentialite(true)}
      />
    );
  }

  if (session.codeProvisoire || changerCodeVolontaire) {
    return (
      <ChoixCodePage
        obligatoire={session.codeProvisoire}
        onTermine={() => setChangerCodeVolontaire(false)}
        onAnnuler={() => setChangerCodeVolontaire(false)}
      />
    );
  }

  if (!fiche) return <Chargement texte="Ouverture de votre espace…" />;

  const commun = { fiche, structureId: session.structureId, onNavigate: setPage };
  let contenu;
  switch (page) {
    case 'agenda': contenu = <AgendaPage agenda={agenda} />; break;
    case 'messages': contenu = <MessagesPage {...commun} messages={messages} />; break;
    case 'documents': contenu = <DocumentsPage messages={messages} charge={messagesCharges} aSigner={aSigner} onSignatures={() => setPage('signatures')} />; break;
    case 'signatures': contenu = <SignaturesPage onAttente={setASigner} />; break;
    case 'profil':
      contenu = (
        <ProfilPage
          {...commun}
          onChangerCode={() => setChangerCodeVolontaire(true)}
          onConfidentialite={() => setVoirConfidentialite(true)}
        />
      );
      break;
    default: contenu = <AccueilPage {...commun} agenda={agenda} nonLus={nonLus} />;
  }

  const banniereSignature = aSigner > 0 && page === 'accueil' ? (
    <button type="button" className="notif-banner" onClick={() => setPage('signatures')}
      style={{ position: 'sticky', top: 0, zIndex: 5, width: 'calc(100% - 32px)', textAlign: 'left', background: '#fffbeb', borderColor: '#f59e0b', color: '#92400e', cursor: 'pointer', marginTop: 10 }}>
      <span style={{ fontSize: 20 }} aria-hidden="true">✍️</span>
      <span><strong style={{ display: 'block' }}>{aSigner} document{aSigner > 1 ? 's' : ''} à signer</strong><span style={{ fontSize: '0.75rem' }}>Touchez ici pour le lire et le signer</span></span>
    </button>
  ) : null;

  return (
    <div className="app-root">
      {banniereSignature}
      {contenu}
      <BarreNavigation active={page === 'signatures' ? 'documents' : page} onChange={setPage} nonLus={nonLus} aSigner={aSigner} />
    </div>
  );
}
