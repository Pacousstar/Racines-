# Explication du Service Worker - GestiCom PWA

**Date :** Février 2026  
**Version :** 0.1.0

---

## 🤔 Qu'est-ce qu'un Service Worker ?

Un **Service Worker** est un script JavaScript qui s'exécute **en arrière-plan**, indépendamment de la page web. Il agit comme un **proxy** entre votre application et le réseau.

---

## 🎯 Rôle du Service Worker

### 1. Interception des Requêtes

Le Service Worker **intercepte toutes les requêtes** HTTP de votre application :

```
┌─────────────┐
│  GestiCom   │
│  (Page Web) │
└──────┬──────┘
       │ Requête HTTP
       │ (ex: /api/ventes)
       ▼
┌─────────────┐
│   Service   │
│   Worker    │
└──────┬──────┘
       │
       ├───► Réseau (si disponible)
       │
       └───► Cache (si hors-ligne)
```

### 2. Gestion du Cache

Le Service Worker **met en cache** :
- ✅ **Pages HTML** visitées
- ✅ **Fichiers CSS/JS** statiques
- ✅ **Images** et ressources
- ✅ **Données API** (selon configuration)

### 3. Mode Hors-Ligne

Quand vous êtes **hors-ligne** :
- Le Service Worker **utilise le cache** au lieu du réseau
- Vous pouvez **consulter** les données en cache
- Les **modifications** sont mises en file d'attente
- **Synchronisation** automatique au retour en ligne

---

## 🔧 Comment ça fonctionne dans GestiCom ?

### Configuration (next.config.ts)

```typescript
const pwaConfig = withPWA({
  dest: "public",              // Dossier de sortie
  cacheOnFrontEndNav: true,   // Cache lors de la navigation
  aggressiveFrontEndNavCaching: true,  // Cache agressif
  reloadOnOnline: true,       // Recharger au retour en ligne
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,  // Toutes les requêtes HTTP
        handler: "NetworkFirst",   // Stratégie : Réseau d'abord
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,       // Maximum 200 entrées en cache
          },
        },
      },
    ],
  },
});
```

### Stratégies de Cache

#### 1. NetworkFirst (Utilisé dans GestiCom)

```
Requête → Essayer le réseau
         ↓
    Succès ? → Utiliser réseau + Mettre en cache
         ↓
    Échec ? → Utiliser cache
```

**Avantage :** Toujours les données les plus récentes si réseau disponible.

#### 2. CacheFirst

```
Requête → Vérifier le cache
         ↓
    Trouvé ? → Utiliser cache
         ↓
    Pas trouvé ? → Réseau + Mettre en cache
```

**Avantage :** Rapide, mais données potentiellement obsolètes.

#### 3. StaleWhileRevalidate

```
Requête → Utiliser cache (même si obsolète)
         ↓
    En parallèle → Mettre à jour le cache depuis le réseau
```

**Avantage :** Rapide + Mise à jour en arrière-plan.

---

## 📦 Génération Automatique

### Lors du Build

```bash
npm run build
```

**Ce qui se passe :**
1. Next.js compile votre application
2. `@ducanh2912/next-pwa` génère automatiquement :
   - `public/sw.js` : Service Worker principal
   - `public/workbox-*.js` : Bibliothèque Workbox
   - `public/manifest.json` : Manifeste (déjà créé)

**Vous n'avez rien à faire** - c'est automatique ! 🎉

### Fichiers Générés

```
public/
├── sw.js              ← Service Worker (généré)
├── workbox-*.js       ← Bibliothèque Workbox (généré)
├── manifest.json      ← Manifeste (créé manuellement)
├── icon-192x192.png  ← Icône PWA (à générer)
└── icon-512x512.png  ← Icône PWA (à générer)
```

---

## 🔄 Cycle de Vie du Service Worker

### 1. Installation

```
Première visite → Service Worker installé
                → Cache initial créé
                → Prêt à fonctionner
```

### 2. Activation

```
Service Worker activé
→ Ancien cache nettoyé (si nécessaire)
→ Prêt à intercepter les requêtes
```

### 3. Interception

```
Requête HTTP → Service Worker intercepte
            → Décide : Réseau ou Cache ?
            → Retourne la réponse
```

### 4. Mise à Jour

```
Nouvelle version disponible
→ Téléchargement en arrière-plan
→ Installation (en attente)
→ Activation au prochain rechargement
```

---

## 💾 Gestion du Cache

### Contenu Mis en Cache

1. **Pages visitées** :
   - `/dashboard`
   - `/dashboard/ventes`
   - `/dashboard/produits`
   - etc.

2. **Ressources statiques** :
   - CSS, JavaScript
   - Images, logos
   - Polices

3. **Données API** (selon configuration) :
   - `/api/ventes` (si visité)
   - `/api/produits` (si visité)

### Limites

- **Maximum 200 entrées** en cache (configuré)
- **Expiration** automatique des anciennes entrées
- **Nettoyage** automatique si cache plein

---

## 🚀 Avantages pour GestiCom

### 1. Performance

- ✅ **Chargement rapide** : Pages en cache
- ✅ **Moins de requêtes** : Ressources en cache
- ✅ **Expérience fluide** : Navigation instantanée

### 2. Mode Hors-Ligne

- ✅ **Consultation** des données en cache
- ✅ **Navigation** dans l'interface
- ✅ **Synchronisation** automatique au retour en ligne

### 3. Expérience Utilisateur

- ✅ **Installation** comme app native
- ✅ **Pas de barre d'adresse** (mode standalone)
- ✅ **Icône** sur l'écran d'accueil

---

## 🔍 Vérification du Service Worker

### Dans le Navigateur (DevTools)

1. **Ouvrir DevTools** (F12)
2. **Onglet "Application"** (Chrome) ou "Stockage" (Firefox)
3. **Service Workers** :
   - Voir le Service Worker actif
   - Voir l'état (actif, en attente)
   - Forcer la mise à jour

4. **Cache Storage** :
   - Voir le contenu du cache
   - Vider le cache si nécessaire

### Commandes Utiles

```javascript
// Dans la console du navigateur

// Vérifier le Service Worker
navigator.serviceWorker.getRegistrations().then(console.log);

// Vider le cache
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

---

## 🐛 Dépannage

### Le Service Worker ne se charge pas

1. **Vérifier HTTPS** : PWA nécessite HTTPS (ou localhost)
2. **Vérifier le build** : `npm run build` doit avoir réussi
3. **Vérifier les fichiers** : `public/sw.js` doit exister

### Le cache ne se met pas à jour

1. **Forcer la mise à jour** : DevTools > Application > Service Workers > "Update"
2. **Vider le cache** : DevTools > Application > Cache Storage > Vider
3. **Recharger** : Ctrl+Shift+R (rechargement forcé)

### Mode hors-ligne ne fonctionne pas

1. **Vérifier le cache** : DevTools > Application > Cache Storage
2. **Vérifier le Service Worker** : DevTools > Application > Service Workers
3. **Tester** : Désactiver le réseau dans DevTools > Network > Offline

---

## 📚 Ressources

- [MDN - Service Workers](https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [@ducanh2912/next-pwa](https://github.com/ducanh2912/next-pwa)

---

**Le Service Worker est le cœur du PWA - il gère tout automatiquement !** 🎉
