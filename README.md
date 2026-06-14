# 🌿 Mon Espace PCGI 87 — PWA Bénéficiaire

Application mobile Progressive Web App (PWA) pour les bénéficiaires des structures d'insertion suivies par PCGI 87.

## Fonctionnalités

- **Accueil** : tableau de bord avec statut, stats, raccourcis
- **Agenda** : RDV et ateliers programmés par la structure
- **Messages** : fil de discussion avec le référent (synchronisé avec l'app principale)
- **Documents** : contrats, bulletins, convocations
- **Profil** : informations personnelles

## Installation & démarrage

```bash
cd pcgi87-beneficiaire-pwa
npm install
npm run dev
```

## Build production

```bash
npm run build
# Les fichiers sont dans /dist — à déployer sur votre hébergeur
```

## Déploiement

Déposez le contenu du dossier `dist/` sur votre serveur web (Apache, Nginx, Vercel, Netlify…). La PWA sera automatiquement installable depuis Chrome/Safari sur mobile.

## Intégration avec l'app principale PCGI 87

Les deux applications **partagent le même `localStorage`** via les clés `pcgi87.*`. Cela signifie :

- Si l'app principale tourne sur le **même domaine**, les données sont partagées automatiquement.
- Si elles tournent sur des **domaines différents**, utiliser une API REST ou un backend partagé (ex : Supabase, Firebase) pour synchroniser les données. Voir section "Évolutions futures" ci-dessous.

### Clés partagées

| Clé | Contenu |
|-----|---------|
| `pcgi87.beneficiaires.v30` | Bénéficiaires par structure |
| `pcgi87.agendas.v30` | Agendas (bénéficiaire, structure, personnel) |
| `pcgi87.chats.v30` | Messages (canaux, directs, bénéficiaires) |
| `pcgi87.secretariat.v30` | Contrats, bulletins, convocations |

### Code d'accès bénéficiaire

Pour chaque bénéficiaire dans l'app principale, ajoutez le champ `accessCode` dans sa fiche. Par défaut : `PCGI87!`.

```js
// Exemple de bénéficiaire avec code d'accès
{
  id: 'ben_001',
  prenom: 'Sophie',
  nom: 'Martin',
  accessCode: 'PCGI-S2026', // Code unique à communiquer au bénéficiaire
  // ...
}
```

## Icônes PWA

Générez les icônes depuis votre logo :
- `public/icons/icon-192.png` (192×192 px)
- `public/icons/icon-512.png` (512×512 px)

Outils recommandés : [PWA Builder](https://www.pwabuilder.com/imageGenerator) ou [Favicon.io](https://favicon.io)

## Installation sur mobile

### iOS (Safari)
1. Ouvrir l'URL dans Safari
2. Appuyer sur « Partager » (icône carrée avec flèche)
3. « Sur l'écran d'accueil »

### Android (Chrome)
1. Ouvrir l'URL dans Chrome
2. La bannière d'installation apparaît automatiquement, ou
3. Menu (⋮) → « Ajouter à l'écran d'accueil »

## Évolutions futures suggérées

- [ ] Backend partagé (Supabase / Firebase) pour multi-domaine
- [ ] Notifications push (Web Push API) pour les RDV
- [ ] Mode hors-ligne complet avec sync différée
- [ ] Signature électronique de documents
- [ ] Téléchargement de documents PDF
- [ ] Formulaire d'auto-évaluation du parcours
