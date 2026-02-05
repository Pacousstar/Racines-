# Récupérer la base du portable et avoir tous les menus (Banque, etc.)

Vous avez **ouvert la version portable** : tous les produits et stocks y sont, mais il manque des menus (Banque, etc.) et les dernières mises à jour.  
Vous voulez **récupérer cette base** et **avoir tous les menus** du projet à jour.

---

## Principe

- **Portable** = une version figée (build) : les menus et le code sont ceux du jour du build. La **base** (produits, stocks, ventes…) est dans `GestiCom-Portable\data\gesticom.db` ou `C:\gesticom_portable_data\gesticom.db`.
- **Projet (GestiCom-master)** = le code à jour (Banque, tous les menus, MAJ). Il utilise la base `prisma\gesticom.db`.

En **important la base du portable dans le projet**, vous gardez **vos données** et vous utilisez **tous les menus** du projet.

---

## Étape 1 : Importer la base du portable dans le projet

1. **Fermez le portable** (Lancer.bat) pour ne pas verrouiller la base.
2. À la racine du **projet** (dossier GestiCom-master), lancez :
   ```bash
   npm run db:import-portable
   ```
   Le script :
   - cherche la base dans `GestiCom-Portable\data\gesticom.db` ou `C:\gesticom_portable_data\gesticom.db` ;
   - la copie vers `prisma\gesticom.db` ;
   - ajoute les colonnes manquantes (schéma à jour).

3. Puis :
   ```bash
   npm run db:reset-admin
   ```
   (Connexion : **admin** / **Admin@123**.)

4. Lancez le **projet** (avec tous les menus) :
   ```bash
   npm run dev:legacy
   ```
   Vous avez alors **vos données** (produits, stocks) et **tous les menus** (dont Banque).

---

## Étape 2 (optionnel) : Recréer un portable à jour avec vos données

Pour avoir une **nouvelle version portable** qui contient à la fois **vos données** et **tous les menus** (Banque, etc.) :

1. Après l’étape 1, la base à jour est dans `prisma\gesticom.db`.
2. À la racine du projet :
   ```bash
   npm run build:portable
   ```
   Cela recrée le dossier **GestiCom-Portable** avec le **code à jour** et copie **prisma\gesticom.db** dans `GestiCom-Portable\data\gesticom.db`.

3. Utilisez ce nouveau **GestiCom-Portable** (Lancer.bat) : vous aurez Banque, tous les menus et vos données.

---

## Résumé

| Objectif | Action |
|----------|--------|
| Utiliser **vos données** + **tous les menus** sur le PC (dev) | `npm run db:import-portable` → `npm run db:reset-admin` → `npm run dev:legacy` |
| Avoir un **portable à jour** (Banque + données) | Après l’import : `npm run build:portable`, puis lancer le nouveau portable |
