# Règle Métier : Un Produit = Un Seul Magasin

## 📋 Règle Fondamentale

**Chaque produit doit être associé à UN SEUL point de vente/magasin. Aucun produit ne peut être enregistré dans plusieurs magasins à la fois.**

## ✅ Implémentation

Cette règle est maintenant respectée dans tout le code :

### 1. Création de Produit (`app/api/produits/route.ts`)
- ✅ Un produit est créé avec un point de vente obligatoire
- ✅ Un seul stock est créé pour ce produit dans le magasin spécifié

### 2. Import Excel (`scripts/importer-nouvelle-bd.js`)
- ✅ Vérifie si un stock existe déjà avant d'en créer un nouveau
- ✅ Si un stock existe, ignore la création d'un nouveau stock

### 3. Import JSON/CSV (`lib/importProduits.ts`)
- ✅ Prend uniquement le premier magasin de la liste `magasins`
- ✅ Vérifie si un stock existe déjà avant d'en créer un nouveau

### 4. Initialisation des Stocks (`app/api/stock/init/route.ts`)
- ✅ Crée un stock uniquement pour les produits qui n'en ont pas
- ✅ Utilise le premier magasin disponible si le produit n'a pas de stock

### 5. Bootstrap (`app/api/produits/bootstrap/route.ts`)
- ✅ Crée un stock uniquement pour les produits qui n'en ont pas
- ✅ Utilise le premier magasin disponible

### 6. Script d'Initialisation (`scripts/initialiser-stocks-tous-magasins.js`)
- ✅ Crée un stock uniquement pour les produits qui n'en ont pas
- ✅ Utilise le premier magasin disponible

### 7. Achats (`app/api/achats/route.ts`)
- ✅ Vérifie que tous les produits sont dans le même magasin que l'achat
- ✅ Si un produit a un stock dans un autre magasin, refuse l'achat ou déplace le stock

### 8. Entrées de Stock (`app/api/stock/entree/route.ts`)
- ✅ Vérifie que le produit existe dans le magasin spécifié
- ✅ Refuse l'entrée si le produit n'est pas dans ce magasin

## 🔧 Script de Correction

Un script a été créé pour corriger les données existantes :
- `scripts/corriger-produits-multiples-magasins.js` : Identifie et corrige les produits avec plusieurs magasins
- Pour chaque produit, garde le magasin avec le plus de stock et supprime les autres

## 📊 Vérification

Pour vérifier que la règle est respectée :
```bash
node scripts/identifier-produits-multiples-magasins.js
```

Ce script liste tous les produits qui ont plusieurs magasins (devrait être 0 après correction).

## ⚠️ Important

- **Ne jamais créer plusieurs stocks pour un même produit**
- **Toujours vérifier l'existence d'un stock avant d'en créer un nouveau**
- **Utiliser `findFirst({ where: { produitId } })` pour vérifier l'existence d'un stock**
- **Un produit sans stock peut être initialisé dans le premier magasin disponible**
