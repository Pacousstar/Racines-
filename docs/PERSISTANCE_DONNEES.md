# Persistance des données – Connexion / Déconnexion

## Les données ne se perdent pas à la déconnexion

- **Connexion** : le serveur lit l’utilisateur en base, crée un **cookie de session** (JWT) et enregistre une entrée dans le **journal d’audit** (connexion). Aucune donnée métier (produits, ventes, stocks, etc.) n’est modifiée ou supprimée.
- **Déconnexion** : le serveur **supprime uniquement le cookie** et enregistre une entrée dans le **journal d’audit** (déconnexion). Aucune table métier (Produit, Vente, Stock, etc.) n’est modifiée ou vidée.

Toutes les données (produits, ventes, achats, stocks, clients, utilisateurs, etc.) sont stockées dans le **fichier SQLite** défini par `DATABASE_URL` (souvent `prisma/gesticom.db`). Ce fichier reste sur le disque ; la connexion et la déconnexion ne font que gérer l’accès (session) à l’application.

## Recommandations pour la production

1. **`DATABASE_URL`**  
   Dans `.env`, utilisez une URL avec `busy_timeout` pour limiter les erreurs de verrouillage SQLite :
   ```env
   DATABASE_URL="file:./prisma/gesticom.db?connection_limit=1&busy_timeout=5000"
   ```
   (Ou le chemin absolu vers votre fichier `.db`.)

2. **Sauvegardes**  
   Faites des sauvegardes régulières du fichier `.db` (menu Sauvegardes ou script `npm run db:backup`). En cas de panne disque ou de corruption, vous pourrez restaurer.

3. **Un seul processus**  
   Évitez d’ouvrir la même base SQLite avec deux instances de l’application en même temps (par ex. une version portable et une installée). Fermez l’une avant de lancer l’autre.

## Protection des stocks lors de l'import Excel

Lors de l’import Excel (`npm run db:importer`), les **stocks existants sont préservés** par défaut pour éviter de perdre les enregistrements de production :

- ✅ Si un produit existe déjà avec un stock, le stock **n’est pas modifié** (les quantités réelles restent intactes)
- ✅ Seuls les produits **sans stock** voient leur stock créé depuis l’Excel
- ✅ Les produits existants sont mis à jour (prix, catégorie, désignation) mais leurs stocks réels sont conservés

Cela garantit que les ventes, achats et ajustements de stock effectués en production ne sont pas écrasés par les valeurs initiales de l’Excel.

Pour forcer l’écrasement des stocks (non recommandé en production) : définir `PRESERVE_STOCKS=false` avant l’import.

## Vérifications effectuées dans le code

- **`/api/auth/login`** : lit l’utilisateur, compare le mot de passe, crée le JWT et écrit un log d’audit. Aucune suppression ni remise à zéro de données.
- **`/api/auth/logout`** : supprime le cookie de session et écrit un log d’audit. Aucune modification des tables métier.
- **Écritures (ventes, achats, stocks, etc.)** : toutes passent par Prisma, qui enregistre les modifications dans le fichier SQLite. Chaque opération est validée en base ; la fermeture du navigateur ou la déconnexion n’efface pas ces enregistrements.
- **`scripts/importer-nouvelle-bd.js`** : préserve les stocks existants lors de l’import Excel (mode par défaut).
