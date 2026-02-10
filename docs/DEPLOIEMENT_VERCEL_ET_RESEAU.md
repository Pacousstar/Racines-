# Déploiement GestiCom sur Vercel et Réseau

**Date :** 6 Février 2026  
**Version :** 1.0.0

---

## 📋 Compréhension : Portable vs Web

### GestiCom-Portable (Actuel)
- **Type** : Application **offline/local**
- **Base de données** : SQLite (fichier local `gesticom.db`)
- **Utilisation** : Un seul PC, une seule base de données
- **Réseau** : Pas de partage entre points de vente
- **Avantages** : Fonctionne sans Internet, données locales
- **Limitations** : Pas de synchronisation multi-utilisateurs

### GestiCom Web (Vercel)
- **Type** : Application **en ligne** (cloud)
- **Base de données** : PostgreSQL/MySQL (base partagée)
- **Utilisation** : Multi-utilisateurs, multi-points de vente
- **Réseau** : Accès depuis n'importe où avec Internet
- **Avantages** : Synchronisation en temps réel, accès multi-sites
- **Limitations** : Nécessite une connexion Internet

---

## 🎯 Scénarios d'Utilisation

### Scénario 1 : Déploiement Web sur Vercel (Recommandé pour multi-points de vente)

**Topologie :**
```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Cloud)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │         GestiCom Web Application                │   │
│  │         (Next.js + API Routes)                 │   │
│  └──────────────────────────────────────────────────┘   │
│                        ↕                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Base de données PostgreSQL              │   │
│  │         (Vercel Postgres / Supabase / Neon)      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        ↕ HTTPS
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Point Vente 1│ │ Point Vente 2│ │ Point Vente 3│
│  (Navigateur)│ │  (Navigateur)│ │  (Navigateur)│
│  https://... │ │  https://... │ │  https://... │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Avantages :**
- ✅ Accès depuis n'importe quel appareil (PC, tablette, mobile)
- ✅ Synchronisation en temps réel entre tous les points de vente
- ✅ Données centralisées et sécurisées
- ✅ Pas d'installation nécessaire (juste un navigateur)
- ✅ Sauvegardes automatiques
- ✅ Mises à jour automatiques

**Inconvénients :**
- ❌ Nécessite une connexion Internet
- ❌ Coût mensuel pour Vercel + base de données (~$20-50/mois)
- ❌ Migration nécessaire de SQLite vers PostgreSQL

---

### Scénario 2 : GestiCom-Portable en Réseau Local (Alternative)

**Topologie :**
```
┌─────────────────────────────────────────────────────────┐
│              RÉSEAU LOCAL (LAN)                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Serveur Local (PC Principal)              │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  GestiCom-Portable (Mode Serveur)         │  │   │
│  │  │  Port 3000 (http://192.168.1.100:3000)    │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  Base SQLite (gesticom.db)                │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                        ↕ LAN                           │
│        ┌───────────────┼───────────────┐               │
│        ↓               ↓               ↓               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Point Vente 1│ │ Point Vente 2│ │ Point Vente 3│   │
│  │  (Navigateur)│ │  (Navigateur)│ │  (Navigateur)│   │
│  │  192.168.1.x │ │  192.168.1.x │ │  192.168.1.x │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Avantages :**
- ✅ Pas de coût mensuel
- ✅ Données restent locales (sécurité)
- ✅ Fonctionne sans Internet (réseau local uniquement)
- ✅ Utilise la version portable existante

**Inconvénients :**
- ❌ Nécessite un PC serveur toujours allumé
- ❌ Accès limité au réseau local uniquement
- ❌ Pas d'accès depuis l'extérieur
- ❌ SQLite peut avoir des problèmes de concurrence avec plusieurs utilisateurs simultanés

---

## 🚀 Option 1 : Déploiement sur Vercel (Recommandé)

### Prérequis

1. **Compte Vercel** : Créer un compte sur [vercel.com](https://vercel.com)
2. **Base de données PostgreSQL** : Une des options suivantes :
   - **Vercel Postgres** (intégré, facile)
   - **Supabase** (gratuit jusqu'à 500MB)
   - **Neon** (gratuit jusqu'à 512MB)
   - **Railway** (gratuit avec limites)

### Étapes de Déploiement

#### Étape 1 : Préparer la Base de Données

**Option A : Vercel Postgres (Recommandé)**

1. Créer un projet sur Vercel
2. Aller dans "Storage" → "Create Database" → "Postgres"
3. Noter les variables d'environnement :
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

**Option B : Supabase (Gratuit)**

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans "Settings" → "Database"
4. Noter la "Connection string"

#### Étape 2 : Modifier le Schéma Prisma

Modifier `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Au lieu de "sqlite"
  url      = env("DATABASE_URL")
}
```

#### Étape 3 : Migrer les Données

```bash
# Générer le client Prisma pour PostgreSQL
npx prisma generate

# Créer les tables dans PostgreSQL
npx prisma db push

# Migrer les données depuis SQLite vers PostgreSQL
# (Créer un script de migration)
```

#### Étape 4 : Configurer Vercel

1. **Installer Vercel CLI** :
   ```bash
   npm install -g vercel
   ```

2. **Se connecter** :
   ```bash
   vercel login
   ```

3. **Créer `vercel.json`** à la racine :
   ```json
   {
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "nextjs",
     "regions": ["cdg1"]
   }
   ```

4. **Configurer les variables d'environnement** :
   - Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Sélectionner le projet
   - "Settings" → "Environment Variables"
   - Ajouter :
     - `DATABASE_URL` : URL de connexion PostgreSQL
     - `SESSION_SECRET` : Votre clé secrète (32+ caractères)
     - `NODE_ENV` : `production`

#### Étape 5 : Déployer

```bash
# Déployer sur Vercel
vercel --prod

# Ou via l'interface web :
# 1. Connecter votre repo GitHub/GitLab
# 2. Vercel détecte automatiquement Next.js
# 3. Cliquer sur "Deploy"
```

#### Étape 6 : Accès Multi-Points de Vente

Une fois déployé, chaque point de vente peut :
- Accéder via le lien Vercel : `https://votre-projet.vercel.app`
- Se connecter avec ses identifiants
- Voir les données en temps réel
- Travailler simultanément (PostgreSQL gère la concurrence)

---

## 🏠 Option 2 : GestiCom-Portable en Réseau Local

### Configuration du Serveur Local

#### Étape 1 : Installer sur le PC Serveur

1. Copier `GestiCom-Portable` sur le PC qui servira de serveur
2. Ajouter `node.exe` dans le dossier
3. Lancer `Lancer.bat`

#### Étape 2 : Configurer l'Adresse IP

1. Trouver l'IP du PC serveur :
   ```powershell
   ipconfig
   # Noter l'adresse IPv4 (ex: 192.168.1.100)
   ```

2. **Le serveur Next.js écoute déjà sur `0.0.0.0` par défaut** (toutes les interfaces)
   - Pas besoin de modifier le code
   - Le serveur est accessible depuis le réseau local automatiquement

#### Étape 3 : Accès depuis les Autres PC

Sur chaque PC des points de vente :
- Ouvrir le navigateur
- Aller à : `http://192.168.1.100:3000`
- Se connecter avec les identifiants

### Limitations SQLite en Multi-Utilisateurs

⚠️ **Important** : SQLite n'est pas optimisé pour plusieurs utilisateurs simultanés :
- Risque de verrous de base de données
- Performance dégradée avec plusieurs connexions
- Risque de corruption si trop d'écritures simultanées

**Recommandation** : Limiter à 2-3 utilisateurs simultanés maximum.

---

## 📊 Comparaison des Options

| Critère | Portable Local | Portable Réseau | Vercel Web |
|---------|---------------|----------------|------------|
| **Coût mensuel** | Gratuit | Gratuit | ~$20-50 |
| **Accès Internet** | Non requis | Non requis | Requis |
| **Multi-utilisateurs** | ❌ Non | ⚠️ Limité (2-3) | ✅ Oui (illimité) |
| **Synchronisation** | ❌ Non | ⚠️ Temps réel local | ✅ Temps réel global |
| **Accès externe** | ❌ Non | ❌ Non | ✅ Oui |
| **Sauvegardes** | Manuel | Manuel | Automatique |
| **Mises à jour** | Manuel | Manuel | Automatique |
| **Sécurité** | Locale | Locale | Cloud sécurisé |
| **Performance** | Excellente | Bonne | Excellente |

---

## 🎯 Recommandation selon Votre Cas

### Si vous avez :
- **1-2 points de vente** → **Portable Réseau Local**
- **3+ points de vente** → **Vercel Web**
- **Besoin d'accès externe** → **Vercel Web**
- **Budget limité** → **Portable Réseau Local**
- **Besoin de synchronisation temps réel** → **Vercel Web**

---

## 📝 Prochaines Étapes

### Pour Vercel :
1. ✅ Créer le compte Vercel
2. ✅ Configurer PostgreSQL (Supabase recommandé pour commencer)
3. ✅ Modifier `prisma/schema.prisma` pour PostgreSQL
4. ✅ Créer un script de migration SQLite → PostgreSQL
5. ✅ Déployer sur Vercel
6. ✅ Tester avec plusieurs utilisateurs

### Pour Réseau Local :
1. ✅ Configurer le PC serveur
2. ✅ Modifier `portable-launcher.js` pour écouter sur `0.0.0.0`
3. ✅ Configurer le pare-feu Windows
4. ✅ Tester l'accès depuis d'autres PC du réseau
5. ✅ Documenter l'adresse IP pour les utilisateurs

---

## 🔧 Scripts Utiles

### Migration SQLite → PostgreSQL

Créer `scripts/migrate-sqlite-to-postgres.js` :

```javascript
const { PrismaClient: SQLiteClient } = require('@prisma/client')
const { PrismaClient: PostgresClient } = require('@prisma/client')

// ... script de migration ...
```

### Configuration Réseau Local

Modifier `scripts/portable-launcher.js` :

```javascript
process.env.HOST = process.env.HOST || '0.0.0.0'  // Écouter sur toutes les interfaces
process.env.PORT = process.env.PORT || '3000'
```

---

## ❓ Questions Fréquentes

**Q : Puis-je utiliser GestiCom-Portable sur Vercel ?**  
R : Non, GestiCom-Portable est conçu pour être local. Pour Vercel, il faut déployer la version web standard.

**Q : Les données sont-elles sécurisées sur Vercel ?**  
R : Oui, Vercel utilise HTTPS et les bases de données sont chiffrées. Les données sont aussi sécurisées que sur un serveur local.

**Q : Puis-je migrer mes données SQLite vers PostgreSQL ?**  
R : Oui, il faut créer un script de migration qui lit SQLite et écrit dans PostgreSQL.

**Q : Combien coûte Vercel ?**  
R : Le plan gratuit permet jusqu'à 100GB de bande passante. Pour la production, le plan Pro coûte ~$20/mois + base de données (~$10-30/mois).

---

**Besoin d'aide ?** Consultez la documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
