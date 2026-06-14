# 📱 Guide Complet : Déployer sur Vercel (15 minutes)

## 🎯 Objectif Final

Obtenir un lien public pour les bénéficiaires :
```
https://mon-app-XXXXX.vercel.app/?benId=demo_001&structId=struct_001
```

---

## 📋 Prérequis

✅ Node.js installé (normalement vous l'avez)  
✅ Compte email gratuit (Gmail, Outlook, etc.)  
✅ 10 minutes de temps libre  

---

## 🚀 **ÉTAPE 1 : Créer un compte GitHub (5 min)**

GitHub = endroit pour stocker votre code (gratuit et nécessaire pour Vercel).

### 1.1 Allez sur GitHub
```
https://github.com/signup
```

### 1.2 Remplissez le formulaire
```
Email : votre-email@gmail.com
Nom d'utilisateur : quelque-chose (ex: cindy-pcgi87)
Mot de passe : fort (8+ caractères)
```

### 1.3 Vérifiez votre email
GitHub vous envoie un code → Entrez-le

### 1.4 Répondez aux questions
- "How many team members will use GitHub?" → **Just me**
- Sautez les propositions de features

✅ **Vous avez un compte GitHub !**

---

## 📦 **ÉTAPE 2 : Mettre votre code sur GitHub (5 min)**

### 2.1 Ouvrez PowerShell/Terminal
```powershell
cd C:\Users\Wonde\pcgi87\pcgi-beneficiaire-pwa
```

### 2.2 Initialisez Git
```powershell
git init
git add .
git commit -m "Initial commit: PWA Mon Espace"
```

### 2.3 Créez un repo sur GitHub
1. Allez sur https://github.com/new
2. **Repository name** : `pcgi87-beneficiaire-pwa`
3. **Description** : `Portail bénéficiaire PCGI 87 — PWA mobile`
4. **Public** (oui)
5. Cliquez **"Create repository"**

### 2.4 Connectez votre code local
Après création, GitHub vous montre des commandes. Exécutez-les :

```powershell
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/pcgi87-beneficiaire-pwa.git
git push -u origin main
```

*(Remplacez `VOTRE_USERNAME` par votre nom d'utilisateur GitHub)*

✅ **Votre code est sur GitHub !**

---

## 🚀 **ÉTAPE 3 : Déployer sur Vercel (5 min)**

### 3.1 Allez sur Vercel
```
https://vercel.com/new
```

### 3.2 Connectez-vous avec GitHub
- Cliquez **"Continue with GitHub"**
- Autorisez Vercel d'accéder à vos repos

### 3.3 Importez votre repo
1. Cherchez `pcgi87-beneficiaire-pwa`
2. Cliquez **"Import"**

### 3.4 Configuration
La page montre :
```
Project Name: pcgi87-beneficiaire-pwa ✓
Framework Preset: Vite ✓
Build Command: npm run build ✓
Output Directory: dist ✓
```

**Tout est correct !** Cliquez **"Deploy"**

### 3.5 Attendez (2-3 minutes)
Vous verrez une animation → "Deployment successful!" 🎉

### 3.6 Récupérez votre URL
Vercel vous donne un lien comme :
```
https://pcgi87-beneficiaire-pwa.vercel.app
```

✅ **C'est publié sur internet !**

---

## 🔗 **ÉTAPE 4 : Créer les liens pour les bénéficiaires**

### Lien pour test (Sophie Martin)
```
https://pcgi87-beneficiaire-pwa.vercel.app/?benId=demo_001&structId=struct_001
```

### Lien pour un vrai bénéficiaire
```
https://pcgi87-beneficiaire-pwa.vercel.app/?benId=ben_XXXXX&structId=struct_001
```

*(Remplacez `ben_XXXXX` par l'ID du bénéficiaire)*

---

## 📱 **ÉTAPE 5 : Tester sur Mobile**

### Sur votre téléphone :
1. Ouvrez le navigateur
2. Allez sur le lien
3. Appuyez sur **"Installer l'application"**
4. L'app s'ajoute à l'écran d'accueil ! 🎉

---

## ✅ **Vérification Finale**

Une fois déployé, vérifiez :
- ✅ Le lien fonctionne
- ✅ L'app charge vite
- ✅ Vous pouvez vous connecter (Sophie Martin / PCGI87!)
- ✅ L'agenda s'affiche
- ✅ L'app s'installe sur mobile

---

## 🎁 **Bonus : Mise à Jour Automatique**

Chaque fois que vous modifiez le code et le mettez sur GitHub :
```powershell
git add .
git commit -m "Description des changements"
git push
```

**Vercel redéploie automatiquement en 1-2 minutes !** 🚀

---

## 🆘 **Dépannage**

### "Ça dit 404"
- Attendez 5 minutes après le déploiement
- Rechargez la page (Ctrl+F5)

### "Git command not found"
- Installez Git : https://git-scm.com/download/win

### "L'authentification échoue"
- Vérifiez nom/code bénéficiaire
- Testez avec : Sophie Martin / PCGI87!

### "Je vois une page blanche"
- Ouvrez la console (F12) pour les erreurs
- Vérifiez que les paramètres `benId` et `structId` sont dans l'URL

---

## 📞 **Besoin d'aide ?**

Dites-moi à quelle étape vous êtes bloqué et je vous aide ! 💪

---

**Vous avez fait du bon travail ! L'app est maintenant accessible à tous ! 🎉**
