# Guide d'utilisation pratique — GestiCom Portable

Ce guide permet de **connaître l'application** et de **naviguer entre les différents menus** de GestiCom-Portable. Il s'adresse à tous les utilisateurs (caissiers, gestionnaires, responsables).

---

## 1. Démarrer et se connecter

### Démarrer l'application
- Double-cliquez sur **Lancer.vbs** (recommandé, sans fenêtre noire) ou sur **Lancer.bat** (avec fenêtre de commande).
- Le navigateur s'ouvre sur **http://localhost:3000**. Si ce n'est pas le cas, saisissez cette adresse dans la barre d’adresse.

### Se connecter
- **Identifiant** : `admin` (ou le login fourni par votre responsable).
- **Mot de passe** : celui communiqué (par défaut : `Admin@123` — à changer dès la première connexion).
- Cliquez sur **Connexion**.

### Déconnexion
- En haut à droite : clic sur votre **nom** ou **avatar** → **Déconnexion**.

---

## 2. Présentation de l'interface

Après connexion, l'écran est organisé ainsi :

| Zone | Rôle |
|------|------|
| **Menu latéral (gauche)** | Liste des modules : Dashboard, Produits, Stock, Ventes, etc. Un clic ouvre le module. |
| **Barre du haut** | Recherche globale, notifications, sélecteur d’entité (si plusieurs), profil utilisateur. |
| **Zone centrale** | Contenu du module sélectionné : tableaux, formulaires, boutons d’action. |

**Astuce** : Sur mobile ou petit écran, le menu peut être replié ; cliquez sur l’icône **Menu** (☰) en haut pour l’afficher.

Les menus visibles dépendent de votre **profil** (rôle et permissions). Si vous ne voyez pas un module (ex. Paramètres, Utilisateurs), c’est que votre compte n’a pas les droits correspondants.

---

## 3. Carte des menus et navigation

Voici la liste des menus et à quoi ils servent. Cliquez sur le **nom du menu** dans la barre latérale pour y accéder.

| Menu | Rôle principal | Actions typiques |
|------|----------------|------------------|
| **Dashboard** | Vue d’ensemble | Voir les indicateurs (produits, ventes, stock, mouvements, clients). |
| **Produits** | Catalogue produits | Créer/modifier des produits, gérer prix et catégories, importer (Excel/CSV). |
| **Stock** | Stocks par magasin | Voir les quantités, faire des entrées/sorties, **inventaire et régularisation**. |
| **Ventes** | Enregistrer les ventes | Créer une vente, choisir magasin/client, ajouter des lignes, enregistrer. |
| **Clients** | Fiche clients | Créer/modifier des clients (nom, tél., type Crédit/Cash). |
| **Fournisseurs** | Fiche fournisseurs | Créer/modifier des fournisseurs. |
| **Achats** | Achats / approvisionnement | Enregistrer les achats (fournisseur, lignes, montant). |
| **Caisse** | Mouvements de caisse | Enregistrer entrées et sorties de caisse (espèces). |
| **Banque** | Comptes bancaires | Créer des comptes (ex. 513, 514), enregistrer dépôts/retraits/virements. |
| **Dépenses** | Dépenses par catégorie | Saisir les dépenses (date, catégorie, libellé, montant). |
| **Charges** | Charges récurrentes | Gérer les charges (loyer, électricité, etc.). |
| **Rapports** | Synthèses et alertes | Voir alertes (stock faible), top produits, statistiques, exporter PDF/Excel. |
| **Comptabilité** | Comptabilité SYSCOHADA | Balance, grand livre, journaux, écritures (souvent en lecture). |
| **Utilisateurs** | Gestion des comptes | Créer/modifier/désactiver des utilisateurs (réservé Admin). |
| **Journal d'audit** | Traçabilité | Consulter les actions effectuées (réservé Admin). |
| **Paramètres** | Configuration | Infos entreprise, devise, TVA, magasins, entités, sauvegardes. |

---

## 4. Description des principaux modules

### Dashboard
- **Accès** : premier lien du menu, ou clic sur le logo / « Dashboard ».
- **Contenu** : cartes (nombre de produits, transactions du jour, produits en stock, mouvements, clients actifs), répartition par catégorie, top produits, ventes récentes.
- **Usage** : avoir une vue synthétique de l’activité sans changer de module.

### Produits
- **Accès** : menu **Produits**.
- **Actions** : **Nouveau** pour créer un produit (code, désignation, catégorie, prix achat/vente). Modifier ou consulter une ligne du tableau. Rechercher par code ou désignation. Exporter / Importer (Excel, CSV) si vos droits le permettent.
- **Conseil** : le **code** doit être unique ; la **catégorie** sert aux filtres et aux rapports.

### Stock
- **Accès** : menu **Stock**.
- **Contenu** : choix du **magasin**, puis liste des produits avec quantités (stock actuel, stock initial).
- **Actions** :
  - **Entrée** : réception, inventaire, correction (augmentation de quantité).
  - **Sortie** : sortie hors vente, correction (diminution).
  - **Inventaire** : ouvrir « Inventaire et Régularisation », saisir les **quantités réelles** par ligne, puis **Régulariser** pour aligner le stock (des mouvements sont créés automatiquement).
- **Conseil** : toujours vérifier le magasin sélectionné avant une entrée ou une sortie.

### Ventes
- **Accès** : menu **Ventes**.
- **Actions** :
  - **Nouvelle vente** (ou bouton dédié) : choisir date, magasin, client (optionnel) ou « nom libre », mode de paiement, puis ajouter des **lignes** (produit, quantité, prix). Le total se calcule automatiquement. Enregistrer.
  - Consulter la liste des ventes, filtrer par date, ouvrir une vente pour voir le détail ou imprimer.
- **Conseil** : en cas de stock insuffisant, l’application peut vous avertir ; vérifier le magasin et les quantités.

### Clients
- **Accès** : menu **Clients**.
- **Actions** : **Nouveau** pour créer un client (nom, téléphone, type Crédit/Cash, plafond crédit si besoin). Modifier ou désactiver un client existant. Rechercher par nom.
- **Usage** : les clients peuvent être choisis lors de la création d’une vente.

### Fournisseurs
- **Accès** : menu **Fournisseurs**.
- **Actions** : **Nouveau** pour créer un fournisseur (nom, téléphone, email). Modifier ou désactiver. Les fournisseurs sont utilisés dans le module **Achats**.

### Achats
- **Accès** : menu **Achats**.
- **Actions** : **Nouvel achat** : fournisseur, date, magasin, lignes (produit, quantité, prix). Enregistrer. Consulter la liste des achats et filtrer par date.
- **Usage** : les achats peuvent alimenter le stock (selon la configuration) et la comptabilité.

### Caisse
- **Accès** : menu **Caisse**.
- **Actions** : enregistrer des **entrées** (encaissements divers) ou **sorties** (paiements, retraits) avec motif et montant. Consulter l’historique et les totaux.
- **Usage** : suivi des mouvements d’espèces (caisse physique).

### Banque
- **Accès** : menu **Banque**.
- **Actions** :
  - **Nouveau compte bancaire** : numéro de compte, nom de la banque, libellé, optionnellement lier un compte comptable (ex. 513, 514).
  - Pour chaque compte : enregistrer **dépôts**, **retraits**, **virements**, **frais**, **intérêts**. Consulter le solde et l’historique.
- **Conseil** : bien choisir le compte (courant / à terme) lors de la création.

### Dépenses
- **Accès** : menu **Dépenses**.
- **Actions** : **Nouvelle dépense** : date, catégorie (ex. DONS, entretien, fournitures), magasin, libellé, montant. Consulter et filtrer la liste. Exporter en PDF/Excel.
- **Usage** : suivi des dépenses par catégorie pour le suivi budgétaire et la comptabilité.

### Charges
- **Accès** : menu **Charges**.
- **Actions** : créer et gérer des charges (loyer, électricité, etc.), avec montants et périodes. Consulter la liste et les montants.

### Rapports
- **Accès** : menu **Rapports**.
- **Contenu** : alertes (ex. stock faible), top produits, statistiques sur une période. Filtres par date, magasin, etc.
- **Actions** : exporter en **PDF** ou **Excel** pour archivage ou analyse.

### Comptabilité
- **Accès** : menu **Comptabilité** (visible selon droits : Super Admin, Comptable).
- **Contenu** : indicateurs du mois, ventes/achats, **Balance**, **Grand livre**, **Journaux**, **Écritures**, **Plan de comptes**. Conformité SYSCOHADA. Les écritures sont souvent générées automatiquement par les ventes, achats, caisse, banque, etc.
- **Actions** : consulter la balance, le grand livre, les journaux ; exporter en PDF. **Diagnostic** pour vérifier l’état de la comptabilité (comptes, journaux, écritures).

### Utilisateurs
- **Accès** : menu **Utilisateurs** (réservé Super Admin / Admin).
- **Actions** : **Créer un utilisateur** (lien vers l’écran d’inscription si autorisé), modifier un utilisateur (nom, rôle, entité, permissions personnalisées, mot de passe), **désactiver** un utilisateur (il disparaît de la liste courante, compte inactif en base).
- **Conseil** : pour qu’un utilisateur accède aux **Paramètres**, lui attribuer la permission **Paramètres : voir** (et éventuellement **modifier**) dans ses permissions personnalisées.

### Journal d'audit
- **Accès** : menu **Journal d'audit** (réservé Super Admin / Admin).
- **Contenu** : historique des actions (connexions, créations, modifications, suppressions) avec date, utilisateur, type d’action, détail.
- **Usage** : traçabilité et contrôle.

### Paramètres
- **Accès** : menu **Paramètres** (selon rôle ou permission « Paramètres : voir »).
- **Contenu** :
  - **Entreprise** : nom, contact, localisation, devise, TVA, logo.
  - **Magasins** : créer/modifier les points de vente.
  - **Entités** : gérer les entités (maison mère, succursales) si multi-entités.
  - **Sauvegardes** : créer une sauvegarde de la base, lister les sauvegardes, restaurer ou télécharger un fichier.
- **Conseil** : faire des **sauvegardes régulières** (bouton dédié) et les copier sur un support externe.

---

## 5. Parcours types

### Enregistrer une vente
1. Menu **Ventes** → **Nouvelle vente** (ou bouton équivalent).
2. Renseigner date, magasin, client (ou nom libre), paiement.
3. Ajouter les lignes (recherche produit, quantité, prix).
4. Vérifier le total, puis **Enregistrer**.

### Faire un inventaire (régularisation des stocks)
1. Menu **Stock** → choisir le **magasin**.
2. Cliquer sur **Inventaire** (ou « Inventaire et Régularisation »).
3. Saisir les **quantités réelles** dans la colonne prévue pour chaque ligne.
4. Cliquer sur **Régulariser le stock** : les écarts génèrent des mouvements (entrée/sortie) automatiquement.

### Créer un compte bancaire
1. Menu **Banque** → **Nouveau compte bancaire** (ou équivalent).
2. Renseigner numéro, nom de la banque, libellé, solde initial si besoin.
3. Optionnel : sélectionner un compte comptable (ex. 513 Banques comptes courants, 514 Banques comptes à terme).
4. Enregistrer.

### Sauvegarder les données
1. Menu **Paramètres** → section **Sauvegardes**.
2. Cliquer sur **Créer une sauvegarde**.
3. Télécharger le fichier ou le copier depuis le dossier indiqué, puis le ranger sur un support sûr (clé USB, disque, cloud).

---

## 6. Conseils de navigation et bonnes pratiques

- **Un seul onglet** : pour éviter les conflits, utilisez de préférence **une seule fenêtre/onglet** sur http://localhost:3000.
- **Fermeture** : pour arrêter l’application, fermez **proprement** la fenêtre Lancer.bat (ou le processus) plutôt que d’éteindre le PC sans fermer l’app (important si la base est sur `C:\gesticom_portable_data`).
- **Recherche** : la barre de recherche en haut permet d’accéder rapidement à des produits, clients, etc., selon les droits.
- **Filtres** : la plupart des listes (ventes, achats, dépenses, stock) ont des filtres par **date** ou **magasin** ; utilisez-les pour cibler les données.
- **Exports** : les boutons **PDF** ou **Excel** en haut à droite des listes permettent d’exporter les données affichées (selon les droits).
- **Permissions** : si un menu ou un bouton n’apparaît pas, c’est que votre compte n’a pas les droits ; contacter l’administrateur pour les faire ajuster (ex. Paramètres pour Miss FOFANA).

---

## 7. En cas de problème

| Problème | À faire |
|----------|--------|
| La page ne s’ouvre pas | Vérifier que **Lancer.bat** (ou Lancer.vbs) a bien été exécuté et que **node.exe** est dans le dossier GestiCom-Portable. |
| « Droits insuffisants » sur Paramètres | Vérifier que l’utilisateur a la permission **Paramètres : voir** (et **modifier** si besoin) dans Gestion des utilisateurs. |
| Erreur lors d’une action | Noter le message affiché ; fermer proprement l’app, relancer, réessayer. Si l’erreur persiste, faire une sauvegarde de `data/gesticom.db` (ou `C:\gesticom_portable_data\gesticom.db`) avant toute manipulation. |
| Données perdues ou incohérentes | Restaurer une **sauvegarde** depuis Paramètres > Sauvegardes (ou remplacer le fichier `.db` par une copie de sauvegarde puis relancer). |

---

**Document** : Guide d’utilisation pratique GestiCom-Portable  
**Version** : 1.0 — À conserver avec l’application pour faciliter la prise en main et la navigation.
