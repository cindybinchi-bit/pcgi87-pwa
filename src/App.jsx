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
    case 'documents': contenu = <DocumentsPage messages={messages} charge={messagesCharges} />; break;
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

  return (
    <div className="app-root">
      {contenu}
      <BarreNavigation active={page} onChange={setPage} nonLus={nonLus} />
    </div>
  );
}
