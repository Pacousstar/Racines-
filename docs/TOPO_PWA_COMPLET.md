# Topo Complet - PWA GestiCom

**Date :** Février 2026  
**Version :** 0.1.0

---

## 📱 Qu'est-ce qu'une PWA ?

Une **Progressive Web App (PWA)** est une application web qui se comporte comme une application native :
- ✅ **Installable** sur mobile, tablette et desktop
- ✅ **Fonctionne hors-ligne** (avec cache)
- ✅ **Expérience native** (pas de barre d'adresse, plein écran)
- ✅ **Notifications** (possibilité future)
- ✅ **Mise à jour automatique**

---

## 🔧 Comment ça fonctionne ?

### 1. Service Worker

Le **Service Worker** est un script JavaScript qui s'exécute en arrière-plan, indépendamment de la page web.

#### Rôle du Service Worker

```
┌─────────────────────────────────────────┐
│         Navigateur (Chrome/Safari)      │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Page Web   │◄───│ Service     │  │
│  │   (GestiCom) │    │ Worker      │  │
│  └──────────────┘    └──────────────┘  │
│         │                   │           │
│         │                   │           │
│         ▼                   ▼           │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Réseau     │    │   Cache      │  │
│  │   (API)      │    │   Local      │  │
│  └──────────────┘    └──────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

#### Fonctionnalités du Service Worker

1. **Interception des requêtes** :
   - Intercepte toutes les requêtes HTTP (pages, API, images, etc.)
   - Décide si utiliser le cache ou le réseau

2. **Gestion du cache** :
   - Met en cache les ressources statiques (CSS, JS, images)
   - Met en cache les pages visitées
   - Gère l'expiration du cache

3. **Mode hors-ligne** :
   - Si pas de réseau → utilise le cache
   - Si réseau disponible → utilise le réseau et met à jour le cache

4. **Synchronisation** :
   - Synchronise les données au retour en ligne
   - Met à jour le cache en arrière-plan

#### Génération Automatique

Le service worker est **généré automatiquement** lors du build :

```bash
npm run build
```

Cela crée :
- `public/sw.js` : Service Worker principal
- `public/workbox-*.js` : Bibliothèque Workbox (gestion du cache)
- `public/manifest.json` : Manifeste de l'application

**Vous n'avez rien à faire** - c'est automatique ! 🎉

---

## 🏪 GestiCom-Portable vs PWA

### GestiCom-Portable

**Qu'est-ce que c'est ?**
- Version **standalone** (autonome) de GestiCom
- Fonctionne **sans installation** de Node.js sur le PC cible
- Toute l'application est dans un dossier (clé USB, disque local)
- Base de données SQLite locale

**Caractéristiques :**
- ✅ Fonctionne **hors-ligne complètement**
- ✅ Base de données **locale** (fichier `.db`)
- ✅ **Une seule instance** par PC
- ✅ Pas besoin d'Internet
- ✅ Installation simple (copier le dossier)

**Utilisation :**
- Point de vente **unique**
- Pas de synchronisation nécessaire
- Données stockées localement

**Limitations :**
- ❌ Pas de synchronisation multi-appareils
- ❌ Données isolées par PC
- ❌ Pas d'accès depuis mobile (sauf si serveur local)

---

### PWA (Progressive Web App)

**Qu'est-ce que c'est ?**
- Version **web** de GestiCom accessible via navigateur
- Installable comme une app native
- Fonctionne avec un **serveur centralisé**
- Base de données sur le serveur

**Caractéristiques :**
- ✅ **Multi-appareils** (PC, mobile, tablette)
- ✅ **Synchronisation** automatique
- ✅ **Mode hors-ligne** (cache des pages)
- ✅ **Installation** sur appareils
- ✅ **Accès partout** (avec Internet)

**Utilisation :**
- Point de vente **multi-appareils**
- Synchronisation automatique
- Données centralisées sur serveur

**Limitations :**
- ❌ Nécessite un **serveur** (ou GestiCom-Portable en mode serveur)
- ❌ Nécessite **Internet** pour la synchronisation
- ❌ Mode hors-ligne **limité** (consultation uniquement)

---

## 🎯 Quelle Version Utiliser ?

### Scénario 1 : Point de Vente Unique (1 PC)

**👉 Utiliser GestiCom-Portable**

- Installation simple (copier le dossier)
- Pas besoin de serveur
- Données locales
- Fonctionne hors-ligne complètement

**Exemple :** Petit commerce avec un seul PC de caisse

---

### Scénario 2 : Point de Vente Multi-Appareils (PC + Mobiles)

**👉 Utiliser PWA avec GestiCom-Portable en Mode Serveur**

**Architecture :**
```
┌─────────────────────────────────────────┐
│      PC Principal (GestiCom-Portable)   │
│      ┌─────────────────────────────┐   │
│      │  Serveur Next.js (port 3000) │   │
│      │  Base de données SQLite      │   │
│      └─────────────────────────────┘   │
│              │                          │
│              │ Réseau Local/WiFi        │
│              │                          │
│    ┌─────────┴─────────┬──────────────┐│
│    │                   │              ││
│    ▼                   ▼              ▼│
│  Mobile 1          Mobile 2         PC 2│
│  (PWA)             (PWA)           (PWA)│
└─────────────────────────────────────────┘
```

**Avantages :**
- ✅ **Un seul serveur** (PC principal)
- ✅ **Multi-appareils** (PC + mobiles)
- ✅ **Synchronisation** automatique
- ✅ **Données centralisées**

**Configuration :**
1. Installer GestiCom-Portable sur le PC principal
2. Démarrer le serveur (Lancer.bat)
3. Configurer le réseau local (WiFi)
4. Installer PWA sur les mobiles/autres PC
5. Pointer vers l'adresse du PC principal (ex: `http://192.168.1.100:3000`)

---

### Scénario 3 : Multi-Points de Vente (Plusieurs Magasins)

**👉 Utiliser PWA avec Serveur Dédié**

- Serveur centralisé (cloud ou serveur dédié)
- Tous les points de vente se connectent au même serveur
- Synchronisation en temps réel
- Gestion centralisée

---

## 🔄 Consolidation des Données Multi-Appareils

### Comment ça fonctionne ?

#### Architecture

```
┌─────────────────────────────────────────┐
│      Serveur Central (PC Principal)      │
│      Base de données SQLite              │
│      ┌─────────────────────────────┐    │
│      │  API REST (Next.js)         │    │
│      │  - /api/ventes              │    │
│      │  - /api/achats               │    │
│      │  - /api/produits             │    │
│      └─────────────────────────────┘    │
│              │                          │
│              │ HTTP/HTTPS               │
│              │                          │
│    ┌─────────┴─────────┬──────────────┐│
│    │                   │              ││
│    ▼                   ▼              ▼│
│  Mobile 1          Mobile 2         PC 2│
│  (PWA)             (PWA)           (PWA) │
│  Cache Local      Cache Local    Cache   │
└─────────────────────────────────────────┘
```

#### Flux de Données

1. **Création d'une vente sur Mobile 1** :
   ```
   Mobile 1 → API Serveur → Base de données
   ```

2. **Consultation sur Mobile 2** :
   ```
   Mobile 2 → API Serveur → Base de données (toujours à jour)
   ```

3. **Mode hors-ligne** :
   ```
   Mobile 1 (hors-ligne) → Cache Local (données en cache)
   Mobile 1 (retour en ligne) → Synchronisation automatique
   ```

#### Synchronisation Automatique

Le PWA synchronise automatiquement :
- ✅ **Nouvelles données** : Créées hors-ligne → synchronisées au retour en ligne
- ✅ **Consultation** : Toujours les données les plus récentes du serveur
- ✅ **Cache** : Mise à jour automatique en arrière-plan

---

## 📋 Guide d'Installation Multi-Appareils

### Étape 1 : Installer le Serveur (PC Principal)

1. **Installer GestiCom-Portable** sur le PC principal
2. **Démarrer le serveur** :
   ```bash
   # Double-clic sur Lancer.bat
   # Ou en ligne de commande :
   cd GestiCom-Portable
   .\node.exe .\server.js
   ```
3. **Vérifier l'adresse IP** :
   ```bash
   # Windows
   ipconfig
   # Notez l'adresse IPv4 (ex: 192.168.1.100)
   ```

### Étape 2 : Configurer le Réseau

1. **PC et mobiles sur le même réseau WiFi**
2. **Vérifier le pare-feu** :
   - Autoriser le port 3000 sur le PC principal
   - Windows : Paramètres > Pare-feu > Autoriser une application

### Étape 3 : Installer PWA sur les Mobiles

1. **Ouvrir le navigateur** (Chrome/Safari) sur mobile
2. **Aller à l'adresse** : `http://192.168.1.100:3000`
3. **Installer l'application** :
   - Chrome : Menu > "Ajouter à l'écran d'accueil"
   - Safari : Partager > "Sur l'écran d'accueil"
4. **L'application apparaît** sur l'écran d'accueil

### Étape 4 : Utilisation

- **Tous les appareils** accèdent à la **même base de données**
- **Synchronisation** automatique en temps réel
- **Mode hors-ligne** : Consultation des données en cache

---

## 🔍 Différences Détaillées

| Caractéristique | GestiCom-Portable | PWA |
|----------------|-------------------|-----|
| **Installation** | Copier le dossier | Installer depuis navigateur |
| **Base de données** | Locale (fichier .db) | Sur serveur |
| **Multi-appareils** | ❌ Non | ✅ Oui |
| **Synchronisation** | ❌ Non | ✅ Automatique |
| **Mode hors-ligne** | ✅ Complet | ⚠️ Limité (cache) |
| **Serveur requis** | ❌ Non | ✅ Oui |
| **Internet requis** | ❌ Non | ⚠️ Pour synchronisation |
| **Utilisation** | Point de vente unique | Multi-appareils |

---

## 💡 Recommandations

### Pour un Point de Vente Unique
👉 **GestiCom-Portable**

### Pour Multi-Appareils (PC + Mobiles)
👉 **PWA avec GestiCom-Portable en mode serveur**

**Avantages :**
- Installation simple (Portable sur PC principal)
- Pas besoin de serveur dédié
- Multi-appareils (mobiles, tablettes, autres PC)
- Synchronisation automatique
- Données centralisées

---

## 🚀 Prochaines Étapes

1. **Générer les icônes PWA** : `npm run pwa:generate-icons`
2. **Tester l'installation** sur mobile
3. **Configurer le réseau** pour multi-appareils
4. **Tester la synchronisation** entre appareils

---

**GestiCom est maintenant prêt pour une utilisation multi-appareils !** 🎉
