# Diagnostic dashboard (chargement long, compteurs à 0) et solutions

## Causes possibles

1. **Base verrouillée** : le portable (Lancer.bat) ou une autre application utilise la même base → SQLite attend le verrou → l’API dépasse le délai → "Chargement trop long".
2. **Base vide ou incohérente** : la base du projet (`prisma/gesticom.db`) n’est pas celle du portable → compteurs à 0.
3. **Schéma ancien** : colonnes manquantes (ex. `updatedAt`) → les requêtes Prisma échouent et l’API renvoie 0.

---

## Corrections déjà appliquées dans le projet

- **`.env`** : `DATABASE_URL` inclut `?busy_timeout=5000` pour que SQLite n’attende pas indéfiniment si la base est verrouillée.
- **API dashboard** : timeout 8 s ; si dépassé, réponse avec 0 et `_timeout: true` au lieu de rester bloquée.
- **Frontend** : timeout porté à 20 s et message invitant à fermer le portable puis réessayer.

---

## Que faire étape par étape

### 1. Fermer le portable

Arrêter **Lancer.bat** (et tout autre programme qui pourrait utiliser `gesticom.db`) pour que le projet soit seul à utiliser la base.

### 2. Utiliser la base du portable dans le projet

Pour avoir **les données du portable** (produits, stocks, etc.) dans le projet (avec tous les menus) :

```bash
npm run db:import-portable
npm run db:reset-admin
npm run dev:legacy
```

Connexion : **admin** / **Admin@123**.

### 3. Lancer le diagnostic (optionnel)

Pour voir quelles requêtes sont lentes ou en erreur (à lancer **sans** serveur Next) :

```bash
npm run db:diagnostic-dashboard
```

Vous verrez le temps de chaque requête (produit.count, stock.count, etc.). Si une requête échoue, exécuter ensuite :

```bash
npm run db:fix-schema
```

### 4. Activer les produits et le stock

Si les compteurs restent à 0 alors que le diagnostic montre des lignes en base :

```bash
npm run db:activer-produits-stock
```

Puis redémarrer le serveur et recharger le dashboard.

---

## Solution de secours : tout repartir depuis un Excel

Si la base reste inutilisable ou que vous préférez repartir des données Excel :

1. **Préparer un fichier Excel** avec au moins une feuille **Produits** et des colonnes comme :
   - **Code** (obligatoire)
   - **Designation** (obligatoire)
   - **Categorie** (ex. DIVERS)
   - **PrixAchat** / **PrixVente** (optionnel)
   - **SeuilMin** (optionnel, ex. 5)

2. Dans l’application (une fois connecté) :
   - Aller dans **Paramètres** → **Import / Export** (ou la page d’import prévue dans le menu).
   - Choisir **Produits**, sélectionner votre fichier Excel, lancer l’import.

3. Les produits seront créés ou mis à jour dans la base. Ensuite vous pouvez :
   - soit continuer à utiliser le projet (dashboard, Banque, etc.) ;
   - soit lancer `npm run db:activer-produits-stock` si vous avez aussi des quantités / stocks à renseigner.

Si vous me donnez le chemin du fichier Excel dans le projet (ex. `data/MonCatalogue.xlsx`) et le nom des colonnes exactes, je peux vous indiquer la procédure précise ou un script d’import adapté (produits + stocks si besoin).
