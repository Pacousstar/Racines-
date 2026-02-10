# Guide de Migration vers Vercel - GestiCom

**Date :** 6 Février 2026  
**Version :** 1.0.0

---

## 📋 Vue d'Ensemble

Ce guide vous accompagne pour migrer GestiCom de SQLite (local) vers PostgreSQL (Vercel) et déployer l'application sur Vercel pour un accès web multi-points de vente.

---

## 🎯 Objectif Final

- ✅ Application accessible via un lien web (ex: `https://gesticom.vercel.app`)
- ✅ Multi-utilisateurs simultanés (illimité)
- ✅ Synchronisation en temps réel entre tous les points de vente
- ✅ Accès depuis n'importe où (Internet requis)
- ✅ Sauvegardes automatiques

---

## 📝 Étapes de Migration

### Étape 1 : Créer un Compte Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Créer un compte (gratuit avec GitHub/Google/Email)
3. Vérifier votre email

### Étape 2 : Créer une Base de Données PostgreSQL

**Option A : Supabase (Recommandé - Gratuit jusqu'à 500MB)**

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un compte
3. Créer un nouveau projet :
   - Nom : `gesticom`
   - Mot de passe : Générer un mot de passe fort
   - Région : Choisir la plus proche (ex: `West US`)
4. Attendre la création (2-3 minutes)
5. Aller dans **Settings** → **Database**
6. Copier la **Connection string** (URI) :
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

**Option B : Vercel Postgres (Intégré)**

1. Dans votre projet Vercel
2. Aller dans **Storage** → **Create Database** → **Postgres**
3. Noter les variables d'environnement générées

**Option C : Neon (Gratuit jusqu'à 512MB)**

1. Aller sur [neon.tech](https://neon.tech)
2. Créer un compte
3. Créer un projet
4. Copier la connection string

### Étape 3 : Préparer le Schéma PostgreSQL

1. **Copier le schéma PostgreSQL** :
   ```bash
   cp prisma/schema.prisma prisma/schema.sqlite.backup.prisma
   cp prisma/schema.postgresql.prisma prisma/schema.prisma
   ```

2. **Vérifier que le provider est `postgresql`** dans `prisma/schema.prisma`

### Étape 4 : Configurer les Variables d'Environnement

Créer/modifier `.env` :

```env
# Base de données SQLite (source)
DATABASE_URL="file:C:/gesticom/gesticom.db"

# Base de données PostgreSQL (destination)
DATABASE_URL_POSTGRES="postgresql://user:password@host:5432/database?schema=public"

# Pour Vercel (sera configuré sur Vercel)
# DATABASE_URL sera remplacé par la variable PostgreSQL de Vercel
SESSION_SECRET="Mignon29@Mignon29@Mignon29@Mign"
NODE_ENV="production"
```

### Étape 5 : Générer le Client Prisma pour PostgreSQL

```bash
# Générer le client Prisma avec le schéma PostgreSQL
npx prisma generate
```

### Étape 6 : Créer les Tables dans PostgreSQL

```bash
# Se connecter à PostgreSQL et créer les tables
DATABASE_URL="postgresql://..." npx prisma db push
```

### Étape 7 : Migrer les Données

```bash
# Exécuter le script de migration
node scripts/migrate-sqlite-to-postgres.js
```

Ce script va :
- Lire toutes les données depuis SQLite
- Les insérer dans PostgreSQL
- Préserver toutes les relations
- Gérer les doublons avec `upsert`

### Étape 8 : Vérifier la Migration

```bash
# Ouvrir Prisma Studio pour PostgreSQL
DATABASE_URL="postgresql://..." npx prisma studio
```

Vérifier que :
- ✅ Tous les produits sont présents (3289)
- ✅ Tous les stocks sont présents
- ✅ Les utilisateurs sont présents
- ✅ Les données sont correctes

### Étape 9 : Préparer le Déploiement Vercel

1. **Créer `vercel.json`** à la racine :
   ```json
   {
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "nextjs",
     "regions": ["cdg1"]
   }
   ```

2. **S'assurer que `schema.prisma` utilise PostgreSQL** :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Vérifier que le build fonctionne** :
   ```bash
   npm run build
   ```

### Étape 10 : Déployer sur Vercel

**Option A : Via l'Interface Web (Recommandé)**

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquer sur **Add New Project**
3. Importer depuis GitHub/GitLab (ou uploader le code)
4. Configurer :
   - **Framework Preset** : Next.js
   - **Root Directory** : `./`
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`
5. **Environment Variables** :
   - `DATABASE_URL` : Votre connection string PostgreSQL
   - `SESSION_SECRET` : Votre clé secrète (32+ caractères)
   - `NODE_ENV` : `production`
6. Cliquer sur **Deploy**

**Option B : Via CLI**

1. **Installer Vercel CLI** :
   ```bash
   npm install -g vercel
   ```

2. **Se connecter** :
   ```bash
   vercel login
   ```

3. **Déployer** :
   ```bash
   vercel --prod
   ```

4. **Configurer les variables d'environnement** :
   ```bash
   vercel env add DATABASE_URL
   vercel env add SESSION_SECRET
   vercel env add NODE_ENV
   ```

### Étape 11 : Vérifier le Déploiement

1. Une fois déployé, Vercel vous donne une URL (ex: `https://gesticom-xxx.vercel.app`)
2. Ouvrir cette URL dans un navigateur
3. Se connecter avec `admin` / `Admin@123`
4. Vérifier que les données sont présentes (3289 produits)

### Étape 12 : Configurer un Domaine Personnalisé (Optionnel)

1. Dans Vercel Dashboard → **Settings** → **Domains**
2. Ajouter votre domaine (ex: `gesticom.votredomaine.com`)
3. Suivre les instructions DNS

---

## 🔧 Configuration Post-Déploiement

### Variables d'Environnement sur Vercel

Dans **Settings** → **Environment Variables**, vérifier :

- ✅ `DATABASE_URL` : Connection string PostgreSQL
- ✅ `SESSION_SECRET` : Clé secrète (32+ caractères)
- ✅ `NODE_ENV` : `production`

### Migrations Automatiques

Pour les futures mises à jour du schéma :

```bash
# Créer une migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer en production
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## 📊 Vérification Post-Migration

### Checklist

- [ ] Base PostgreSQL créée et accessible
- [ ] Schéma Prisma modifié pour PostgreSQL
- [ ] Tables créées dans PostgreSQL (`npx prisma db push`)
- [ ] Données migrées (3289 produits vérifiés)
- [ ] Application déployée sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Application accessible via l'URL Vercel
- [ ] Connexion fonctionnelle
- [ ] Données affichées correctement
- [ ] Test avec plusieurs utilisateurs simultanés

### Tests Multi-Utilisateurs

1. Ouvrir plusieurs navigateurs (ou onglets en navigation privée)
2. Se connecter avec différents comptes
3. Effectuer des opérations simultanées :
   - Créer des ventes
   - Modifier des stocks
   - Ajouter des produits
4. Vérifier que les changements sont visibles en temps réel

---

## 🐛 Dépannage

### Erreur : "Unable to connect to database"

**Solutions** :
1. Vérifier que `DATABASE_URL` est correct dans Vercel
2. Vérifier que la base PostgreSQL est accessible depuis Internet
3. Vérifier les règles de pare-feu de la base de données

### Erreur : "Schema is not in sync"

**Solutions** :
```bash
# Synchroniser le schéma
DATABASE_URL="postgresql://..." npx prisma db push
```

### Erreur : "Migration failed"

**Solutions** :
1. Vérifier que toutes les données SQLite sont valides
2. Vérifier les contraintes de clés étrangères
3. Relancer la migration en mode debug

### Performance lente

**Solutions** :
1. Vérifier la région de la base PostgreSQL (choisir la plus proche)
2. Vérifier les index dans PostgreSQL
3. Optimiser les requêtes

---

## 💰 Coûts Estimés

### Plan Gratuit Vercel
- ✅ 100 GB de bande passante/mois
- ✅ Déploiements illimités
- ✅ SSL automatique
- ⚠️ Limite : 100 secondes de build

### Base de Données
- **Supabase** : Gratuit jusqu'à 500MB, puis ~$25/mois
- **Neon** : Gratuit jusqu'à 512MB, puis ~$19/mois
- **Vercel Postgres** : ~$20/mois

**Total estimé** : **Gratuit** (petit usage) ou **~$20-50/mois** (usage intensif)

---

## 📝 Notes Importantes

1. **Sauvegarde SQLite** : Garder une copie de `gesticom.db` avant migration
2. **Test en staging** : Tester d'abord sur un projet Vercel de test
3. **Rollback** : En cas de problème, vous pouvez toujours revenir à SQLite local
4. **Mises à jour** : Les futures mises à jour se feront via Git → Vercel (déploiement automatique)

---

## 🎉 Félicitations !

Une fois déployé, GestiCom sera accessible depuis n'importe où avec un simple lien web, et tous vos points de vente pourront travailler simultanément avec synchronisation en temps réel !

---

**Pour plus d'informations, consultez :**
- `docs/DEPLOIEMENT_VERCEL_ET_RESEAU.md` - Guide complet
- `docs/RESUME_DEPLOIEMENT.md` - Résumé rapide
