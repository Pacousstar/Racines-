# Topo général — GestiCom

**Dernière mise à jour :** janvier 2026  
**État :** GestiCom et GestiCom-Portable fonctionnels.

---

## Topo en tableau

| Domaine | Fait | En cours | À faire |
|---------|------|----------|---------|
| **Auth & accès** | Session, rôles (SUPER_ADMIN, ADMIN, COMPTABLE, AGENT), login/logout, compte par défaut (seed). | — | — |
| **Pages & écrans** | Accueil, login, dashboard, produits, stock, ventes, achats, clients, fournisseurs, dépenses, rapports, comptabilité, paramètres, recherche globale. | — | — |
| **Ventes** | Liste, nouvelle vente (magasin, client, paiement), crédit (montant payé / reste à payer), popup « Ajoutez au moins une ligne », détail, annulation. | — | Exports PDF/Excel ; impression tickets. |
| **Achats** | Liste (filtre dates), nouvel achat, montant payé / reste à payer, détail, entrées stock. | — | Exports. |
| **Produits** | Liste, recherche, nouveau (magasin obligatoire, code auto par catégorie), import JSON/CSV/Excel, bootstrap, stock par magasin. | — | — |
| **Stock** | Filtre magasin, entrée, init, tableau, édition qté / qté init., alertes seuil. | — | Sorties hors vente, inventaire, corrections. |
| **Clients / Fournisseurs** | CRUD, recherche, type CASH/CREDIT (clients), plafond. | — | — |
| **Dépenses** | Liste, nouvelle dépense, montant payé / reste à payer, catégories. | — | — |
| **Rapports** | Alertes stock, top produits, mouvements ; filtre période (Du/Au, 7j, 30j, ce mois). | — | Exports PDF/Excel. |
| **Comptabilité** | CA, ventes, achats, dépenses ; filtre mois/année ; évolution vs mois précédent. | — | Exports. |
| **Paramètres** | Entreprise (nom, contact, devise, TVA), magasins (CRUD). | — | — |
| **Base de données** | Schéma SQLite (Prisma), montantPaye/statutPaiement, ensure-schema pour portable, sauvegardes avant build. | — | — |
| **GestiCom-Portable** | Build (npm run build:portable), Lancer.bat (1 instance, 1 onglet), base data/ ou C:\gesticom_portable_data, chemins avec espaces, doc (BD, procédure test). | — | — |
| **Visuel** | Logo (public/logo.png), favicon (public/favicon.ico) sur toutes les pages. | — | — |
| **Charges / Caisse** | Modèles en base. | — | UI Charges ; UI Caisse (mouvements). |
| **Multi-entité / PWA** | Entite/Utilisateur/Magasin en base. | — | Sélecteur entité ; impression ; PWA / hors-ligne. |

---

## 1. Ce qui a été fait

### 1.1 Application principale (web)
- **Authentification** : session (cookie), rôles SUPER_ADMIN, ADMIN, COMPTABLE, AGENT. Compte par défaut : `admin` / `Admin@123` (seed).
- **Pages** : accueil, connexion, dashboard, produits, stock, ventes, achats, clients, fournisseurs, dépenses, rapports, comptabilité, paramètres, recherche globale.
- **Formulaires** : lisibilité assurée (globals.css, fonds par bloc), champs montant payé / reste à payer sur Ventes, Achats, Dépenses (PAYE, PARTIEL, CREDIT).
- **Ventes** : nouvelle vente (magasin, client/libre, mode paiement), **paiement à crédit** avec champ « Montant payé (avance) » et affichage « Reste à payer » ; popup « Ajoutez au moins une ligne » si enregistrement sans ligne (ajout de lignes dans la popup puis enregistrement immédiat).
- **Produits** : nouveau produit avec **sélection du magasin** (obligatoire), **code suggéré automatiquement** par catégorie (API `/api/produits/next-code`) ; stock créé uniquement pour le magasin choisi.
- **Recherche** : champ header → `/dashboard/recherche?q=`, résultats produits, clients, fournisseurs, ventes.
- **Filtres** : dates sur Ventes, Achats, Rapports ; mois/année sur Comptabilité.
- **Import** : produits (JSON, CSV, Excel), bootstrap catalogue + init stocks.
- **Logo et favicon** : logo GestiCom (`public/logo.png`) et favicon (`public/favicon.ico`) intégrés sur toutes les pages (accueil, login, dashboard sidebar/header, écran de chargement).

### 1.2 Base de données
- **Schéma** : SQLite (Prisma), entités Entite, Utilisateur, Magasin, Produit, Stock, Mouvement, Client, Fournisseur, Vente/Achat (lignes), Depense, Charge, Caisse, Parametre.
- **Paiements** : colonnes `montantPaye` et `statutPaiement` sur Vente, Achat, Depense ; script `backfill-montant-paye.js` pour bases existantes.
- **Mise à jour automatique du schéma (portable)** : script `ensure-schema.js` ajoute les colonnes ou tables manquantes (montantPaye, statutPaiement, table Depense) sans perte de données.

### 1.3 GestiCom-Portable
- **Build** : `npm run build:portable` → dossier **GestiCom-Portable** (standalone Next + `data/gesticom.db` + scripts + `public/`).
- **Lancement** : **Lancer.bat** ou Lancer.vbs ; une seule instance (verrou PID), un seul onglet navigateur.
- **Base** : utilisation de `data/gesticom.db` ; si chemin avec espaces, copie vers **C:\gesticom_portable_data** et resynchronisation à l’arrêt.
- **Schéma** : au démarrage, **ensure-schema.js** est exécuté (via `execFileSync`, compatible chemins avec espaces) pour mettre à jour la base si besoin.
- **Sauvegardes** : avant chaque build, sauvegarde automatique de la base portable et de `C:\gesticom_portable_data` dans le projet (`backup-portable-data-*.db`, `backup-portable-C-drive-*.db`).
- **Documentation** : `docs/BD_PORTABLE_ET_BUILD.md`, `docs/PROCEDURE_TEST.md`, README-Portable.txt dans le build.

### 1.4 Qualité et stabilité
- **Rendu dynamique** : `export const dynamic = 'force-dynamic'` sur le layout dashboard pour éviter les erreurs « couldn't be rendered statically » (cookies).
- **TypeScript** : correction des types (ex. `magasinId` possibly null dans `api/produits`).
- **Procédure de test** : `docs/PROCEDURE_TEST.md` pour valider lancement portable, schéma BD, ventes (popup), nouveau produit, comptabilité, stabilité de la base.

---

## 2. Ce qui est en cours

- **Aucun chantier bloquant** : l’application et le portable sont utilisables au quotidien.
- **Suivi optionnel** : mises à jour majeures (ex. Prisma 7.x, Next.js) non appliquées volontairement pour limiter les régressions.

---

## 3. Ce qui reste à faire

### Court terme
| Priorité | Tâche | Note |
|----------|--------|------|
| 1 | **Exports** : PDF / Excel des rapports, ventes, stock | Mentionné (Comptabilité, rapports). |
| 2 | **Tests** : exécuter la procédure de test sur un autre PC après chaque grosse évolution | Vérifier portable, BD, ventes, produits, comptabilité. |

### Moyen terme
| Priorité | Tâche | Note |
|----------|--------|------|
| 3 | **Charges** : modèle Charge en base ; pas d’UI dédiée. | Schéma prêt. |
| 4 | **Caisse** : modèle Caisse ; pas d’UI (mouvements entrée/sortie caisse). | Schéma prêt. |
| 5 | **Mouvements de stock** : sorties hors vente, inventaire, corrections. | Partiellement couvert par entrées et ventes. |

### Plus tard
| Priorité | Tâche | Note |
|----------|--------|------|
| 6 | **Multi-entité** : sélecteur d’entité et filtres (Entite/Utilisateur/Magasin déjà en base). | Évolution métier. |
| 7 | **Impression** : tickets de vente, bons de commande. | |
| 8 | **Mode hors-ligne** : PWA / cache pour usage terrain. | |

---

## 4. Résumé

| Domaine | État |
|---------|------|
| **GestiCom (web)** | ✅ Fonctionnel : auth, pages, formulaires, ventes (dont crédit + popup lignes), produits (magasin + code auto), dépenses, achats, comptabilité, rapports, recherche, logo/favicon. |
| **GestiCom-Portable** | ✅ Fonctionnel : Lancer.bat sans erreur, une instance, un onglet, schéma BD mis à jour au démarrage, base stable (data/ ou C:\gesticom_portable_data). |
| **Base de données** | ✅ Schéma à jour ; ensure-schema pour anciennes bases ; sauvegardes avant build portable. |
| **À enchaîner** | Exports PDF/Excel ; puis Charges, Caisse, mouvements de stock ; multi-entité, impression, PWA selon besoins. |

---

*Document de référence pour le suivi du projet. À mettre à jour au fil des livraisons.*
