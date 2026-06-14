# 🚀 Déploiement PWA "Mon Espace" sur Mobile

## 📋 Prérequis

- Node.js 18+ installé
- Accès au serveur ou à un hébergement web

---

## 🛠️ Installation & Déploiement

### 1️⃣ Préparation

```bash
cd pcgi-beneficiaire-pwa
npm install
npm run build
```

### 2️⃣ Test en Local

```bash
npm run serve
```

L'app sera disponible sur : **http://localhost:3000**

### 3️⃣ Accès depuis mobile

1. Sur votre téléphone (iPhone ou Android)
2. Ouvrez le navigateur
3. Accédez à : `http://VOTRE_IP:3000/?benId=demo_001&structId=struct_001`

   *(Remplacez `VOTRE_IP` par l'adresse IP de votre ordinateur)*

4. Appuyez sur le menu d'installation
   - **iPhone** : Partager → Sur l'écran d'accueil
   - **Android** : Menu (⋮) → Installer l'application

---

## 🌐 Déploiement en Production

### Option A : Netlify (Recommandé - Gratuit)

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

Vous obtiendrez une URL publique : `https://xxxxx.netlify.app`

### Option B : Vercel (Gratuit)

```bash
npm install -g vercel
npm run build
vercel --prod
```

### Option C : Serveur Node.js

```bash
npm install
npm run serve
```

Serveur démarre sur le port 3000.

---

## 📱 Accès Bénéficiaire

### Lien Direct

```
https://votre-domaine.com/?benId=BENEFICIARY_ID&structId=struct_001
```

**Exemple pour démo :**
```
https://monespace.pcgi87.fr/?benId=demo_001&structId=struct_001
```

### Identifiants de Démo

- **Nom** : Sophie Martin
- **Code** : PCGI87!

---

## 🔐 Paramètres URL

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `benId` | ID du bénéficiaire | `ben_abc123` |
| `structId` | ID de la structure | `struct_001` |
| `invite` | ID d'invitation (optionnel) | `invite_xyz789` |

**Exemple complet :**
```
https://monespace.pcgi87.fr/?benId=ben_abc123&structId=struct_001&invite=invite_xyz789
```

---

## 📲 Installation sur Mobile

### iPhone (iOS)

1. Ouvrir Safari
2. Accéder au lien
3. Appuyer sur le bouton Partage (↗️)
4. Sélectionner "Sur l'écran d'accueil"
5. Nommer l'app → Ajouter

### Android

1. Ouvrir Chrome
2. Accéder au lien
3. Appuyer sur le menu (⋮)
4. Sélectionner "Installer l'application"
5. Confirmer l'installation

---

## ✅ Vérification

Une fois installée, l'app doit avoir :

- ✓ Icône "Mon Espace" sur l'écran d'accueil
- ✓ Barre de titre avec le thème bleu (#0e4bb7)
- ✓ Interface fullscreen sans barres du navigateur
- ✓ Fonctionnement hors-ligne (données en cache)
- ✓ Logo PCGI 87 au démarrage

---

## 🛠️ Configuration Avancée

### Variables d'Environnement

```bash
# .env ou démarrage du serveur
PORT=3000                          # Port du serveur
NODE_ENV=production               # Mode production
```

### Personnalisation

Éditer `vite.config.js` :
- Icônes : `/public/icons/`
- Couleurs : Modifier `theme_color` et `background_color`
- Nom : Modifier `name` et `short_name`

---

## 📦 Pour Distribution Google Play & App Store

Pour une véritable app native :

1. **Android** : Utiliser Android Studio + Gradle
2. **iOS** : Utiliser Xcode + Capacitor
3. **Alternative** : Services comme EAS (Expo Application Services)

*(Documentation fournie sur demande)*

---

## 🆘 Dépannage

| Problème | Solution |
|----------|----------|
| "Page non trouvée" | Vérifier l'URL, rebrand builder |
| "L'app ne s'affiche pas" | Vider le cache, réinstaller |
| "Pas de paramètres benId" | Ajouter `?benId=XXX&structId=XXX` à l'URL |
| "Erreur localStorage" | Vérifier les permissions du navigateur |

---

## 📞 Support

- 📧 Email : support@pcgi87.fr
- 📱 Téléphone : Contactez votre coordinateur
- 🐛 Bug : Signalez-les via l'app

---

**PCGI 87 — Portail Bénéficiaire v1.0**
