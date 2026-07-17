# 🔧 PATCH App.jsx — Connexion Firebase Firestore
# Applique ces 4 modifications dans App.jsx pour synchroniser
# bénéficiaires, agenda et messagerie en temps réel.

## ── MODIFICATION 1 : Importer firebase-sync.js (ligne ~32) ──

REMPLACER :
  import { addBeneficiary, initFirebase } from './firebase-service.js';

PAR :
  import { addBeneficiary, initFirebase } from './firebase-service.js';
  import {
    initSync,
    syncBeneficiaire,
    deleteBeneficiaire as fbDeleteBeneficiaire,
    listenBeneficiaires,
    syncAgendaBeneficiaire,
    deleteAgendaEvent as fbDeleteAgendaEvent,
    listenAgenda,
    syncMessage,
    syncConversationMeta,
  } from './firebase-sync.js';


## ── MODIFICATION 2 : Initialiser firebase-sync au démarrage (ligne ~713) ──

REMPLACER :
  useEffect(() => {
    initFirebase().catch(err => {
      console.warn('Firebase non disponible:', err);
    });
  }, []);

PAR :
  useEffect(() => {
    initFirebase().catch(err => console.warn('Firebase non disponible:', err));
    initSync().then(() => {
      // Écouter les bénéficiaires en temps réel
      const unsubBenef = listenBeneficiaires('struct_001', (list) => {
        if (list.length > 0) {
          setBeneficiairesByStructure((prev) => ({ ...prev, struct_001: list }));
        }
      });
      // Écouter l'agenda bénéficiaire en temps réel
      const unsubAgenda = listenAgenda('struct_001', (events) => {
        setAgendaState((prev) => ({
          ...prev,
          beneficiary: { ...prev.beneficiary, struct_001: events },
        }));
      });
      return () => { unsubBenef(); unsubAgenda(); };
    }).catch(err => console.warn('Firebase Sync non disponible:', err));
  }, []);


## ── MODIFICATION 3 : Syncer vers Firestore quand on ajoute un bénéficiaire (ligne ~1866) ──

REMPLACER :
    setBeneficiairesByStructure((prev) => ({ ...prev, [currentStructureId]: [entry, ...(prev[currentStructureId] || [])] }));

    // Sauvegarder dans Firebase
    addBeneficiary(currentStructureId, entry).catch(err => {
      console.warn('Firebase non disponible pour sauvegarder le bénéficiaire', err);
    });

PAR :
    setBeneficiairesByStructure((prev) => ({ ...prev, [currentStructureId]: [entry, ...(prev[currentStructureId] || [])] }));
    syncBeneficiaire(currentStructureId, entry).catch(err => console.warn('Sync bénéficiaire:', err));


## ── MODIFICATION 4 : Syncer l'agenda bénéficiaire vers Firestore (ligne ~1377) ──

Dans la fonction addBeneficiaryAgendaItem, APRÈS :
    setAgendaState((prev) => ({
      ...prev,
      beneficiary: {
        ...prev.beneficiary,
        [currentStructureId]: sortAgenda([...(prev.beneficiary[currentStructureId] || []), entry]),
      },
    }));

AJOUTER :
    syncAgendaBeneficiaire(currentStructureId, entry).catch(err => console.warn('Sync agenda:', err));


## ── MODIFICATION 5 : Syncer les messages bénéficiaire vers Firestore (ligne ~1300) ──

Dans la fonction sendBeneficiaryMessage, APRÈS :
    setChatState((prev) => ({
      ...prev,
      beneficiaryConversations: {
        ...prev.beneficiaryConversations,
        [conversationId]: {
          ...
        },
      },
    }));

AJOUTER :
    syncMessage(conversationId, {
      authorType: 'professional',
      authorId: currentUser.id,
      authorName: currentUser.nom,
      content: text(beneficiaryChatForm.message),
      scope: 'beneficiary',
    }).catch(err => console.warn('Sync message:', err));
    syncConversationMeta(conversationId, {
      beneficiaryId: beneficiary.id,
      beneficiaryName: `${beneficiary.prenom} ${beneficiary.nom}`.trim(),
      referentId: currentUser.id,
      referentName: currentUser.nom,
      structureId: currentStructureId,
    }).catch(err => console.warn('Sync meta:', err));
