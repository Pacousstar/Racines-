# Guide de Fusion de Bases de Données GestiCom

Ce guide explique comment fusionner les données d'une ancienne version de GestiCom-Portable (en production) dans une nouvelle version mise à jour, **sans écraser les données existantes**.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Étapes de fusion](#étapes-de-fusion)
4. [Vérification après fusion](#vérification-après-fusion)
5. [Dépannage](#dépannage)
6. [Fonctionnement détaillé](#fonctionnement-détaillé)

---

## Vue d'ensemble

### Scénario

Vous avez :
- **Ancienne version** : GestiCom-Portable sur un PC en production avec de vraies données
- **Nouvelle version** : GestiCom-Portable mise à jour avec des données de test (certaines à 0)

Vous voulez :
- Transférer toutes les données de l'ancienne version vers la nouvelle
- **Sans écraser** les données existantes dans la nouvelle version
- Conserver toutes les transactions, produits, clients, etc.

### Solution

Le script `fusion-bases-production.js` fusionne intelligemment les deux bases :
- **Tables de référence** (Produit, Client, Fournisseur, etc.) : fusion par code/identifiant unique, évite les doublons
- **Transactions** (Vente, Achat, Mouvement, etc.) : ajoute toutes les transactions avec mapping des IDs
- **Stocks** : fusionne les quantités (additionne)
- **Écritures comptables** : fusionne toutes les écritures

---

## Prérequis

1. **Node.js** installé sur votre PC
2. **better-sqlite3** installé (normalement déjà présent dans le projet)
3. **Accès aux deux bases de données** :
   - Base source (ancienne version) : `C:\GestiCom-Portable\data\gesticom.db` (ou autre emplacement)
   - Base cible (nouvelle version) : `GestiCom-Portable\data\gesticom.db`

---

## Étapes de fusion

### Étape 1 : Localiser les bases de données

#### Base source (ancienne version en production)

Sur le PC en production, localisez le fichier `gesticom.db` :
- **Emplacement 1** : `GestiCom-Portable\data\gesticom.db`
- **Emplacement 2** : `C:\gesticom_portable_data\gesticom.db`

**Copiez ce fichier** vers votre PC de développement (clé USB, partage réseau, etc.)

#### Base cible (nouvelle version)

Sur votre PC de développement :
- **Emplacement** : `GestiCom-Portable\data\gesticom.db`

### Étape 2 : Préparer l'environnement

1. **Ouvrir un terminal** (PowerShell ou CMD)
2. **Naviguer vers le projet** :
   ```powershell
   cd C:\Users\EMERAUDE\Projets\GestiCom-master
   ```

3. **Vérifier que better-sqlite3 est installé** :
   ```powershell
   npm list better-sqlite3
   ```
   
   Si ce n'est pas installé :
   ```powershell
   npm install better-sqlite3
   ```

### Étape 3 : Exécuter la fusion

#### Méthode 1 : Via npm (recommandé)

Ajoutez dans `package.json` :
```json
"scripts": {
  "fusion:production": "node scripts/fusion-bases-production.js"
}
```

Puis exécutez :
```powershell
npm run fusion:production "<chemin-base-source>" "<chemin-base-cible>"
```

#### Méthode 2 : Directement avec Node.js

```powershell
node scripts/fusion-bases-production.js "<chemin-base-source>" "<chemin-base-cible>"
```

#### Exemple concret

Si votre base source est sur `D:\Sauvegarde\gesticom-ancien.db` et votre base cible est `GestiCom-Portable\data\gesticom.db` :

```powershell
node scripts/fusion-bases-production.js "D:\Sauvegarde\gesticom-ancien.db" "GestiCom-Portable\data\gesticom.db"
```

### Étape 4 : Suivre la progression

Le script affiche la progression en temps réel :

```
✓ Sauvegarde créée: GestiCom-Portable\data\gesticom.db.backup-202502031430.db

=== DÉBUT DE LA FUSION ===

1. Fusion des Entités...
   ✓ 1 entité(s) ajoutée(s)
2. Fusion des Magasins...
   ✓ 2 magasin(s) ajouté(s)
3. Fusion des Produits...
   ✓ 150 produit(s) ajouté(s)
...
```

---

## Vérification après fusion

### 1. Vérifier le rapport de fusion

À la fin de l'exécution, le script affiche un rapport :

```
=== RAPPORT DE FUSION ===

Éléments ajoutés/fusionnés:
  - Entités: 1
  - Magasins: 2
  - Produits: 150
  - Clients: 45
  - Fournisseurs: 12
  - Utilisateurs: 3
  - Ventes: 234
  - Achats: 67
  ...
```

### 2. Tester dans GestiCom

1. **Lancer GestiCom-Portable** :
   ```powershell
   cd GestiCom-Portable
   .\Lancer.bat
   ```

2. **Se connecter** avec vos identifiants

3. **Vérifier les données** :
   - **Ventes** : Vérifier que toutes les ventes sont présentes
   - **Achats** : Vérifier que tous les achats sont présents
   - **Produits** : Vérifier que tous les produits sont présents
   - **Clients** : Vérifier que tous les clients sont présents
   - **Stock** : Vérifier que les quantités sont correctes
   - **Rapports** : Vérifier que les statistiques sont cohérentes

### 3. Vérifier la cohérence

- Les totaux doivent correspondre à vos attentes
- Les dates doivent être correctes
- Les montants doivent être cohérents
- Les relations (ventes → clients, achats → fournisseurs) doivent être correctes

---

## Dépannage

### Erreur : "La base source n'existe pas"

**Solution** :
- Vérifier que le chemin de la base source est correct
- Utiliser des guillemets si le chemin contient des espaces
- Utiliser le chemin absolu (ex: `C:\Users\...`)

### Erreur : "La base cible n'existe pas"

**Solution** :
- Vérifier que la base cible existe
- Créer la base cible si nécessaire (lancer GestiCom une fois pour la créer)

### Erreur : "better-sqlite3 is not defined"

**Solution** :
```powershell
npm install better-sqlite3
```

### Erreur : "database is locked"

**Solution** :
1. Fermer complètement GestiCom (toutes les fenêtres)
2. Attendre quelques secondes
3. Réessayer la fusion

### Les données ne sont pas toutes fusionnées

**Causes possibles** :
- Conflits de numéros (ventes, achats avec le même numéro)
- Schéma de base différent entre les deux versions
- Erreurs silencieuses (vérifier les messages d'avertissement)

**Solution** :
- Vérifier les messages d'avertissement dans la console
- Consulter le rapport de fusion
- Vérifier manuellement dans GestiCom

### Les stocks ne sont pas corrects

**Solution** :
- Le script additionne les quantités des stocks existants
- Si un produit existe dans les deux bases, les quantités sont additionnées
- Vérifier manuellement si nécessaire

---

## Fonctionnement détaillé

### Stratégie de fusion

Le script utilise une stratégie de fusion intelligente :

#### 1. Tables de référence (fusion par identifiant unique)

- **Entite** : Fusion par `code`
- **Magasin** : Fusion par `code`
- **Produit** : Fusion par `code`
- **Client** : Fusion par `nom` + `telephone`
- **Fournisseur** : Fusion par `nom` + `telephone`
- **Utilisateur** : Fusion par `login`
- **PlanCompte** : Fusion par `numero`
- **Journal** : Fusion par `code`

**Comportement** : Si un élément existe déjà (même code/identifiant), il n'est pas dupliqué. Les IDs sont mappés pour les relations.

#### 2. Tables transactionnelles (ajout de toutes les transactions)

- **Vente** : Ajout si le numéro n'existe pas déjà
- **Achat** : Ajout si le numéro n'existe pas déjà
- **Mouvement** : Ajout si la combinaison (date, produit, magasin, type, quantite) n'existe pas
- **Caisse** : Ajout si la combinaison (date, magasin, type, montant, motif) n'existe pas
- **Charge** : Ajout si la combinaison (date, magasin, type, rubrique, montant) n'existe pas
- **Depense** : Ajout si la combinaison (date, magasin, categorie, libelle, montant) n'existe pas
- **EcritureComptable** : Ajout si le numéro n'existe pas déjà

**Comportement** : Toutes les transactions sont ajoutées, avec mapping automatique des IDs des références.

#### 3. Tables de liaison

- **VenteLigne** : Ajoutées automatiquement avec les ventes
- **AchatLigne** : Ajoutées automatiquement avec les achats
- **Stock** : Fusion des quantités (additionne si le produit existe déjà dans le même magasin)

#### 4. Tables de configuration

- **Parametre** : Conservée de la base cible (nouvelle version)
- **DashboardPreference** : Conservée de la base cible

### Mapping des IDs

Le script crée un mapping des IDs pour gérer les relations :

```javascript
idMaps = {
  entite: { ancienId: nouveauId },
  magasin: { ancienId: nouveauId },
  produit: { ancienId: nouveauId },
  // ...
}
```

Exemple :
- Dans la base source, une vente référence `clientId = 5`
- Dans la base cible, ce client a maintenant `id = 12`
- Le script mappe automatiquement : `clientId = 12` dans la nouvelle vente

### Sauvegarde automatique

Avant toute modification, le script crée une sauvegarde de la base cible :

```
gesticom.db.backup-YYYYMMDDHHmmss.db
```

Cette sauvegarde vous permet de restaurer l'état précédent si nécessaire.

---

## Exemple complet

### Situation

- **Base source** : `D:\Backup\gesticom-production.db` (ancienne version avec données réelles)
- **Base cible** : `GestiCom-Portable\data\gesticom.db` (nouvelle version avec données de test)

### Commande

```powershell
cd C:\Users\EMERAUDE\Projets\GestiCom-master
node scripts/fusion-bases-production.js "D:\Backup\gesticom-production.db" "GestiCom-Portable\data\gesticom.db"
```

### Résultat attendu

```
✓ Sauvegarde créée: GestiCom-Portable\data\gesticom.db.backup-202502031430.db

=== DÉBUT DE LA FUSION ===

1. Fusion des Entités...
   ✓ 1 entité(s) ajoutée(s)
2. Fusion des Magasins...
   ✓ 2 magasin(s) ajouté(s)
3. Fusion des Produits...
   ✓ 150 produit(s) ajouté(s)
4. Fusion des Clients...
   ✓ 45 client(s) ajouté(s)
5. Fusion des Fournisseurs...
   ✓ 12 fournisseur(s) ajouté(s)
6. Fusion des Utilisateurs...
   ✓ 3 utilisateur(s) ajouté(s)
7. Fusion du Plan de Comptes...
   ✓ 25 compte(s) ajouté(s)
8. Fusion des Journaux...
   ✓ 5 journal(aux) ajouté(s)
9. Fusion des Mouvements de Stock...
   ✓ 234 mouvement(s) ajouté(s)
10. Fusion des Stocks...
   ✓ 150 stock(s) fusionné(s)
11. Fusion des Ventes...
   ✓ 234 vente(s) ajoutée(s)
12. Fusion des Achats...
   ✓ 67 achat(s) ajouté(s)
13. Fusion des Opérations de Caisse...
   ✓ 89 opération(s) de caisse ajoutée(s)
14. Fusion des Charges...
   ✓ 45 charge(s) ajoutée(s)
15. Fusion des Dépenses...
   ✓ 123 dépense(s) ajoutée(s)
16. Fusion des Écritures Comptables...
   ✓ 456 écriture(s) comptable(s) ajoutée(s)

=== RAPPORT DE FUSION ===

Éléments ajoutés/fusionnés:
  - Entités: 1
  - Magasins: 2
  - Produits: 150
  - Clients: 45
  - Fournisseurs: 12
  - Utilisateurs: 3
  - Plan de Comptes: 25
  - Journaux: 5
  - Mouvements: 234
  - Stocks: 150
  - Ventes: 234
  - Achats: 67
  - Opérations de Caisse: 89
  - Charges: 45
  - Dépenses: 123
  - Écritures Comptables: 456

✓ Fusion terminée avec succès!
✓ Base cible mise à jour: GestiCom-Portable\data\gesticom.db
✓ Sauvegarde disponible: GestiCom-Portable\data\gesticom.db.backup-202502031430.db

⚠ IMPORTANT: Vérifiez les données dans GestiCom avant de supprimer la sauvegarde!
```

---

## ⚠️ Important

1. **Toujours faire une sauvegarde manuelle** avant la fusion (en plus de la sauvegarde automatique)
2. **Tester dans GestiCom** après la fusion avant de supprimer les sauvegardes
3. **Vérifier la cohérence** des données (totaux, dates, relations)
4. **Conserver les sauvegardes** jusqu'à ce que vous soyez sûr que tout fonctionne

---

**Dernière mise à jour** : Février 2025
