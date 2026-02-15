# Guide Test Rapide - 5 Minutes (Corrections GestiCom)

**🎯 Objectif** : Valider rapidement les 4 corrections critiques

---

## ⚡ Test Express (5 minutes chrono)

### ✅ **Test 1 : Cache Multi-Postes** (90 secondes)

```bash
# Terminal 1 : Lancer GestiCom
npm run dev

# Ouvrir 2 navigateurs :
# - Chrome : http://localhost:3000
# - Edge : http://localhost:3000
```

**Dans Chrome** :
1. Connexion (admin/Admin@123)
2. Ventes → Nouvelle vente
3. Remplir rapidement et enregistrer

**Dans Edge** (SANS F5) :
1. Aller sur Ventes
2. ✅ **La vente apparaît immédiatement**

**✅ RÉSULTAT** : Cache OK si vente visible dans Edge sans F5

---

### ✅ **Test 2 : Colonnes Ventes** (60 secondes)

**Dans le tableau des ventes** :
1. Observer les en-têtes de colonnes
2. Vérifier la présence de :
   - ✅ Colonne **"Statut paiement"** (6ème colonne)
   - ✅ Colonne **"Reste à payer"** (7ème colonne)
   - ✅ Colonne **"Statut"** (8ème colonne)

**✅ RÉSULTAT** : Colonnes OK si 3 colonnes séparées visibles

---

### ✅ **Test 3 : Bouton Modifier Stock** (90 secondes)

1. Aller sur **Stock**
2. Choisir un magasin
3. Observer le tableau :
   - ✅ Chaque ligne a un **bouton crayon** (Modifier)
4. Cliquer sur un bouton crayon :
   - ✅ Modal s'ouvre
   - ✅ Champs modifiables

**✅ RÉSULTAT** : Stock OK si bouton visible partout

---

### ✅ **Test 4 : Annulation Stock** (60 secondes)

1. Créer une vente rapide (n'importe quel produit, qté 1)
2. Noter le numéro : **V-__________**
3. Aller sur Stock → Noter quantité actuelle du produit : **____**
4. Retour Ventes → Annuler la vente (bouton X rouge)
5. Retour Stock → Vérifier quantité : **____**

**✅ RÉSULTAT** : Annulation OK si stock revenu à la quantité initiale

---

## 🎯 Verdict Express

| Test | OK ? |
|------|------|
| Cache multi-postes | ok |
| Colonnes ventes | ok |
| Bouton modifier stock | ok |
| Annulation stock | ok |

**Si 4/4 ✅** → **Corrections validées** ✅  
**Si < 4** → Voir `TESTS_VALIDATION_CHECKLIST.md` pour détails

---

## 🔧 Commandes Utiles

```bash
# Démarrer mode dev
npm run dev

# Build production
npm run build
npm run start:standalone

# Build portable
npm run build:portable

# Vérifier base de données
npx prisma studio
```

---

**Durée totale** : 5 minutes  
**Testeur** : _DG DIHI__________  
**Date** : __15/02/2026_________
