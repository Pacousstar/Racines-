# Procédure de test – GestiCom (portable et fonctionnalités)

Cette procédure permet de valider les corrections et évolutions récentes : base portable, schéma BD, nouvelle vente avec popup lignes, nouveau produit (magasin + code auto), une seule instance / un seul onglet.

---

## 1. Prérequis

- **Projet** : `npm run build:portable` exécuté depuis le dossier du projet (celui où se trouve `package.json`).
- **Portable** : dossier **GestiCom-Portable** copié sur la machine de test (ou clé USB), avec **node.exe** ajouté dans le dossier.
- **Base** : présence de **data/gesticom.db** dans GestiCom-Portable (ou base restaurée depuis une sauvegarde).

---

## 2. Test du lancement portable (une instance, un onglet, schéma BD)

### 2.1 Premier lancement

1. Ouvrir le dossier **GestiCom-Portable**.
2. Double-cliquer sur **Lancer.bat** (ou Lancer.vbs).
3. **Vérifier** :
   - Une seule fenêtre de console s’affiche (pas plusieurs).
   - Un seul message du type : `Serveur demarre sur http://localhost:3000`.
   - Un seul onglet (ou une seule fenêtre) du navigateur s’ouvre sur `http://localhost:3000`.
4. Se connecter avec le compte par défaut (ex. **admin** / **Admin@123**).

### 2.2 Schéma de la base (ensure-schema)

Si la base était ancienne (sans colonnes `montantPaye` / `statutPaiement`), au démarrage le script **ensure-schema.js** doit avoir mis à jour la base. Vérifier :

- Aller dans **Ventes** : la liste s’affiche sans erreur « colonne montantPaye n’existe pas ».
- Aller dans **Achats** : idem.
- Aller dans **Dépenses** : idem.
- Aller dans **Comptabilité** (si rôle SUPER_ADMIN ou COMPTABLE) : la page s’affiche avec CA, ventes, achats, dépenses.

### 2.3 Une seule instance

1. Sans fermer la première fenêtre Lancer.bat, double-cliquer à nouveau sur **Lancer.bat**.
2. **Vérifier** : un message du type « GestiCom est déjà lancé (PID …) » s’affiche et le second lancement s’arrête (pas de deuxième serveur ni deuxième onglet).

### 2.4 Arrêt et relance

1. Fermer la fenêtre **Lancer.bat** (arrêt propre du serveur).
2. Relancer **Lancer.bat**.
3. **Vérifier** : le serveur redémarre, un seul onglet s’ouvre, les données (ventes, achats, etc.) sont toujours là (même base utilisée).

---

## 3. Test Nouvelle vente – popup « Ajoutez au moins une ligne »

### 3.1 Ouverture de la popup

1. Aller dans **Ventes**.
2. Cliquer sur **Nouvelle vente**.
3. Renseigner **Date**, **Magasin** (obligatoire). Optionnel : client ou nom libre, mode de paiement.
4. **Ne pas** ajouter de ligne dans le formulaire principal.
5. Cliquer sur **Enregistrer la vente**.

**Résultat attendu** : une **fenêtre popup** s’ouvre avec le titre « Ajoutez au moins une ligne » et le texte explicatif (stock ne reflète pas encore les produits). Aucun simple message d’erreur sous le formulaire sans popup.

### 3.2 Ajout de lignes dans la popup et enregistrement

1. Dans la popup :
   - Choisir un **produit** dans la liste.
   - Saisir **quantité** et **prix unitaire** (ou laisser le prix proposé).
   - Cliquer sur **Ajouter**.
2. **Vérifier** : la ligne apparaît dans le tableau de la popup avec désignation, qté, P.U., total.
3. Optionnel : ajouter une deuxième ligne (même procédure).
4. Cliquer sur **Valider et enregistrer la vente**.

**Résultat attendu** :
- La popup se ferme.
- La vente est enregistrée (elle apparaît en tête de la liste des ventes).
- Le formulaire « Nouvelle vente » se ferme.
- Aucune erreur serveur (pas de message « erreur serveur »).

### 3.3 Annulation de la popup

1. Ouvrir à nouveau **Nouvelle vente**, remplir magasin (sans ligne), cliquer **Enregistrer la vente** pour rouvrir la popup.
2. Cliquer sur **Annuler** dans la popup.

**Résultat attendu** : la popup se ferme, le formulaire « Nouvelle vente » reste ouvert (aucune vente enregistrée).

---

## 4. Test Nouveau produit (magasin + code auto)

### 4.1 Code suggéré par catégorie

1. Aller dans **Produits**.
2. Cliquer sur **Nouveau**.
3. **Vérifier** : le champ **Code** est prérempli avec une valeur du type **DIVE-001** (ou **XXXX-001** selon la catégorie).
4. Changer la **Catégorie** (ex. **BOISSONS** si elle existe).

**Résultat attendu** : le **Code** se met à jour automatiquement (ex. **BOIS-001**, **BOIS-002** selon les produits déjà présents dans cette catégorie).

### 4.2 Magasin obligatoire

1. Dans le formulaire **Nouveau produit**, laisser **Code** (ou le modifier), renseigner **Désignation**.
2. **Ne pas** choisir de magasin.
3. Cliquer sur **Enregistrer**.

**Résultat attendu** : le navigateur signale que le champ **Magasin** est requis (validation formulaire).

4. Choisir un **Magasin** dans la liste (ex. un seul magasin).
5. Cliquer sur **Enregistrer**.

**Résultat attendu** : le produit est créé et une ligne de **stock** est créée **uniquement pour ce magasin** (pas dans tous les magasins). Vérifier dans **Stock** ou **Entrée de stock** que le produit n’apparaît qu’avec le magasin choisi.

---

## 5. Test enregistrements (Vente, Achat, Dépense) – pas d’erreur serveur

### 5.1 Nouvelle vente (avec au moins une ligne)

1. **Ventes** → **Nouvelle vente**.
2. Renseigner magasin, ajouter au moins une ligne (produit, qté, prix), puis **Enregistrer la vente**.

**Résultat attendu** : message de succès ou retour à la liste sans « Erreur serveur ».

### 5.2 Nouvel achat

1. **Achats** → **Nouvel achat**.
2. Renseigner magasin, fournisseur (ou libre), au moins une ligne, mode de paiement, puis enregistrer.

**Résultat attendu** : enregistrement réussi, pas d’erreur serveur.

### 5.3 Nouvelle dépense

1. **Dépenses** → **Nouvelle dépense**.
2. Renseigner date, magasin (si applicable), catégorie, libellé, montant, mode de paiement, puis enregistrer.

**Résultat attendu** : enregistrement réussi, pas d’erreur serveur.

---

## 6. Test Comptabilité

1. Se connecter avec un compte **SUPER_ADMIN** ou **COMPTABLE**.
2. Aller dans **Comptabilité** (menu).

**Résultat attendu** : la page s’affiche avec :
- Filtre mois / année.
- Cartes (CA, Ventes, Clients, etc.).
- Synthèse du mois (CA, achats, dépenses, marge, résultat).
- Listes des ventes, achats et dépenses du mois.

Pas d’erreur « colonne montantPaye n’existe pas » ni page blanche.

---

## 7. Test stabilité de la base (déconnexion, arrêt PC)

1. Après avoir enregistré au moins une vente (ou un achat, une dépense), noter le **numéro** ou les données.
2. Fermer l’onglet navigateur (ou se déconnecter).
3. Fermer la fenêtre **Lancer.bat**.
4. Relancer **Lancer.bat**, rouvrir `http://localhost:3000`, se reconnecter.

**Résultat attendu** : les données sont toujours présentes (même base **data/gesticom.db** ou **C:\gesticom_portable_data\gesticom.db**).

5. Optionnel : éteindre le PC, le rallumer, relancer **Lancer.bat** et vérifier à nouveau que les données sont conservées.

---

## 8. Synthèse des points de contrôle

| Test | Critère de succès |
|------|-------------------|
| Lancement portable | Un seul message « Serveur demarré », un seul onglet |
| Double Lancer.bat | Message « GestiCom est déjà lancé », pas de 2e serveur |
| Ventes / Achats / Dépenses | Listes et formulaires sans erreur « montantPaye » |
| Comptabilité | Page affichée avec CA, ventes, achats, dépenses |
| Nouvelle vente sans ligne | Popup « Ajoutez au moins une ligne » s’ouvre |
| Popup : ajouter lignes + Valider | Vente enregistrée, popup fermée |
| Nouveau produit : code | Code suggéré selon la catégorie |
| Nouveau produit : magasin | Magasin obligatoire ; stock créé uniquement pour le magasin choisi |
| Enregistrement vente/achat/dépense | Pas de message « Erreur serveur » |
| Relance / redémarrage PC | Même base, données conservées |

---

*Document à mettre à jour si de nouveaux cas de test sont ajoutés.*
