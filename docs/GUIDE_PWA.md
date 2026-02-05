# Guide PWA (Progressive Web App) - GestiCom

**Date :** Février 2026  
**Version :** 0.1.0

---

## 📱 Qu'est-ce qu'une PWA ?

Une Progressive Web App (PWA) permet d'installer GestiCom sur votre appareil (mobile, tablette, ordinateur) comme une application native, avec des fonctionnalités hors-ligne.

---

## ✨ Fonctionnalités PWA

### 1. Installation sur l'appareil
- **Mobile/Tablette** : Ajouter à l'écran d'accueil
- **Ordinateur** : Installer comme application desktop
- **Icône** : Apparaît dans le menu des applications

### 2. Mode hors-ligne
- **Cache automatique** : Les pages visitées sont mises en cache
- **Fonctionnalités disponibles** : Consultation des données en cache
- **Synchronisation** : Mise à jour automatique au retour en ligne

### 3. Expérience native
- **Démarrage rapide** : Lancement comme une app native
- **Pas de barre d'adresse** : Interface plein écran
- **Notifications** : Possibilité de notifications push (futur)

---

## 🚀 Installation

### Sur Mobile/Tablette (Android/iOS)

#### Android (Chrome)
1. Ouvrir GestiCom dans Chrome
2. Appuyer sur le menu (⋮) en haut à droite
3. Sélectionner **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**
4. Confirmer l'installation
5. L'icône GestiCom apparaît sur l'écran d'accueil

#### iOS (Safari)
1. Ouvrir GestiCom dans Safari
2. Appuyer sur le bouton **Partager** (□↑)
3. Faire défiler et sélectionner **"Sur l'écran d'accueil"**
4. Personnaliser le nom si nécessaire
5. Appuyer sur **"Ajouter"**

### Sur Ordinateur (Chrome/Edge)

#### Chrome
1. Ouvrir GestiCom dans Chrome
2. Cliquer sur l'icône **"Installer"** dans la barre d'adresse (ou menu ⋮)
3. Confirmer l'installation
4. L'application s'ouvre dans une fenêtre dédiée

#### Edge
1. Ouvrir GestiCom dans Edge
2. Cliquer sur l'icône **"Installer"** dans la barre d'adresse
3. Confirmer l'installation
4. L'application s'ouvre dans une fenêtre dédiée

---

## 🔧 Configuration pour les Développeurs

### 1. Générer les icônes PWA

```bash
# Installer sharp (si pas déjà fait)
npm install sharp --save-dev

# Générer les icônes
npm run pwa:generate-icons
```

Cela crée :
- `public/icon-192x192.png`
- `public/icon-512x512.png`

### 2. Vérifier le manifest

Le fichier `public/manifest.json` contient :
- Nom de l'application
- Icônes
- Couleurs du thème
- Raccourcis (shortcuts)

### 3. Service Worker

Le service worker est généré automatiquement par `@ducanh2912/next-pwa` lors du build :
- Cache les ressources statiques
- Cache les pages visitées
- Gère la synchronisation hors-ligne

### 4. Build avec PWA

```bash
# Build normal (PWA activé en production)
npm run build

# Le service worker est généré dans public/sw.js
# Le manifest est dans public/manifest.json
```

---

## 🐛 Dépannage

### L'application ne s'installe pas

1. **Vérifier HTTPS** : PWA nécessite HTTPS (ou localhost en développement)
2. **Vérifier le manifest** : `public/manifest.json` doit être accessible
3. **Vérifier les icônes** : `icon-192x192.png` et `icon-512x512.png` doivent exister
4. **Vérifier le service worker** : `public/sw.js` doit être généré après le build

### Le mode hors-ligne ne fonctionne pas

1. **Vérifier le cache** : Ouvrir DevTools > Application > Cache Storage
2. **Vérifier le service worker** : DevTools > Application > Service Workers
3. **Forcer la mise à jour** : DevTools > Application > Service Workers > "Update"

### Les icônes ne s'affichent pas

1. **Vérifier les fichiers** : `public/icon-192x192.png` et `public/icon-512x512.png`
2. **Générer les icônes** : `npm run pwa:generate-icons`
3. **Vérifier le manifest** : Les chemins dans `manifest.json` doivent être corrects

---

## 📊 Fonctionnalités Hors-Ligne

### Disponible hors-ligne
- ✅ Consultation des pages visitées (en cache)
- ✅ Navigation dans l'interface
- ✅ Consultation des données en cache

### Nécessite une connexion
- ❌ Création/Modification de données (ventes, achats, etc.)
- ❌ Synchronisation avec le serveur
- ❌ Export de données

**Note** : Les modifications sont automatiquement synchronisées au retour en ligne.

---

## 🔄 Mise à jour de l'Application

L'application PWA se met à jour automatiquement :
1. Au retour en ligne, le service worker vérifie les mises à jour
2. Si une nouvelle version est disponible, elle est téléchargée en arrière-plan
3. L'utilisateur est notifié et peut recharger pour appliquer la mise à jour

---

## ✅ Checklist de Vérification

- [ ] `public/manifest.json` existe et est valide
- [ ] `public/icon-192x192.png` existe (192x192 pixels)
- [ ] `public/icon-512x512.png` existe (512x512 pixels)
- [ ] `next.config.ts` configure `@ducanh2912/next-pwa`
- [ ] `app/layout.tsx` référence le manifest
- [ ] Build réussi (`npm run build`)
- [ ] Service worker généré (`public/sw.js`)
- [ ] Test d'installation sur mobile/desktop
- [ ] Test du mode hors-ligne

---

## 📚 Ressources

- [Documentation @ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa)
- [MDN - Progressive Web Apps](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)

---

**GestiCom est maintenant une PWA !** 🎉
