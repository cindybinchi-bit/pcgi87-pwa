import React, { useEffect, useMemo, useState } from 'react';
import { suivreSession, seDeconnecter } from './firebase.js';
import { suivreFiche, suivreAgenda, suivreMessages, idConversation, CANAUX } from './donnees.js';
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

const FILS_VIDES = { cip: [], secretariat: [], encadrant: [] };

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = vérification en cours
  const [page, setPage] = useState('accueil');
  const [fiche, setFiche] = useState(null);
  const [agenda, setAgenda] = useState([]);
  // Trois messageries séparées : CIP, secrétariat / RH, encadrant(e) technique
  const [fils, setFils] = useState(FILS_VIDES);
  const [indisponibles, setIndisponibles] = useState({});
  const [canal, setCanal] = useState('cip');
  const [messagesCharges, setMessagesCharges] = useState(false);
  const [avisConnexion, setAvisConnexion] = useState('');
  const [voirConfidentialite, setVoirConfidentialite] = useState(false);
  const [changerCodeVolontaire, setChangerCodeVolontaire] = useState(false);
  const [aSigner, setASigner] = useState(0);
  // Messages en cours d'écriture (un par messagerie) : gardés en mémoire, pas sur le téléphone
  const [brouillons, setBrouillons] = useState({});

  useEffect(() => {
    nettoyerAnciennesDonnees();
    return suivreSession((s) => {
      setSession(s);
      if (!s) {
        setFiche(null);
        setAgenda([]);
        setFils(FILS_VIDES);
        setIndisponibles({});
        setCanal('cip');
        setMessagesCharges(false);
        setBrouillons({});
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
    const recevoir = (id) => (list) => {
      setFils((f) => ({ ...f, [id]: list }));
      setIndisponibles((i) => (i[id] ? { ...i, [id]: false } : i));
      if (id === 'cip') setMessagesCharges(true);
    };
    const u3 = suivreMessages(idConversation(benId, 'cip', structureId), recevoir('cip'), surErreur);
    // Nouvelles messageries : si la structure ne les a pas encore activées, on l'indique
    // simplement dans l'onglet, sans fermer la session.
    const autres = CANAUX.filter((c) => c.id !== 'cip').map((c) => suivreMessages(
      idConversation(benId, c.id, structureId),
      recevoir(c.id),
      () => setIndisponibles((i) => ({ ...i, [c.id]: true })),
    ));
    return () => { u1(); u2(); u3(); autres.forEach((u) => u()); };
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

  const nonLusParCanal = useMemo(() => Object.fromEntries(CANAUX.map((c) => [
    c.id,
    (fils[c.id] || []).filter((m) => m.authorType === 'professional' && !m.readAt).length,
  ])), [fils]);
  const nonLus = Object.values(nonLusParCanal).reduce((a, b) => a + b, 0);
  const tousLesMessages = useMemo(() => CANAUX.flatMap((c) => fils[c.id] || []), [fils]);

  // Depuis l'accueil ou la barre du bas : ouvrir directement la messagerie qui a du nouveau
  function allerA(p) {
    if (p === 'messages' && page !== 'messages') {
      const avecNouveau = CANAUX.find((c) => nonLusParCanal[c.id] > 0);
      if (avecNouveau) setCanal(avecNouveau.id);
    }
    setPage(p);
  }

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

  const commun = { fiche, structureId: session.structureId, onNavigate: allerA };
  let contenu;
  switch (page) {
    case 'agenda': contenu = <AgendaPage {...commun} agenda={agenda} />; break;
    case 'messages':
      contenu = (
        <MessagesPage
          {...commun}
          canal={canal}
          onCanal={setCanal}
          messages={fils[canal] || []}
          nonLusParCanal={nonLusParCanal}
          indisponible={Boolean(indisponibles[canal])}
          brouillon={brouillons[canal] || ''}
          onBrouillon={(v) => setBrouillons((b) => ({ ...b, [canal]: v }))}
        />
      );
      break;
    case 'documents': contenu = <DocumentsPage {...commun} messages={tousLesMessages} charge={messagesCharges} aSigner={aSigner} onSignatures={() => setPage('signatures')} />; break;
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
      <BarreNavigation active={page === 'signatures' ? 'documents' : page} onChange={allerA} nonLus={nonLus} aSigner={aSigner} />
    </div>
  );
}
