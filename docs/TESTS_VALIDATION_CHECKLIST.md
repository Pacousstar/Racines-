# Checklist Tests de Validation - GestiCom Corrections

**Date** : 15/02/2026  
**Version** : Corrections Stabilisation v1.0  
**Testeur** : _______________

---

## 📋 Tests à Effectuer

### ✅ TEST 1 : Cache Multi-Postes (CRITIQUE)

#### Prérequis
- [ ] 2 PC ou 2 navigateurs différents connectés
- [ ] Les deux accèdent à GestiCom

#### Procédure
1. **PC 1** :
   - [ ] Se connecter à GestiCom
   - [ ] Aller sur Ventes
   - [ ] Créer une nouvelle vente (noter le numéro : _______)
   - [ ] ✅ Vente enregistrée avec succès

2. **PC 2** (SANS appuyer sur F5) :
   - [ ] Aller sur Ventes
   - [ ] **Actualiser la page** (clic sur le bouton "Filtrer" ou attendre 2s)
   - [ ] ✅ **La vente du PC1 apparaît immédiatement**

#### Résultat attendu
- ✅ Vente visible sur PC2 sans F5 manuel
- ✅ Délai < 2 secondes

#### Statut
- [ ] ✅ RÉUSSI
- [ ] ❌ ÉCHOUÉ - Raison : _____________________

---

### ✅ TEST 2 : Colonnes Ventes

#### Procédure
1. [ ] Aller sur la page **Ventes**
2. [ ] Créer une vente à crédit :
   - Montant total : 10 000 F
   - Montant payé : 3 000 F
   - Mode paiement : **Crédit**
3. [ ] Observer le tableau des ventes

#### Vérifications
- [ ] ✅ Colonne **"Statut paiement"** présente
  - [ ] Affiche : **PARTIEL** (badge jaune/orange)
- [ ] ✅ Colonne **"Reste à payer"** présente
  - [ ] Affiche : **7 000 F**
- [ ] ✅ Colonne **"Statut"** présente (séparée)
  - [ ] Affiche : **Validée** (badge vert)

#### Résultat attendu
- 3 colonnes distinctes visibles
- Calculs corrects

#### Statut
- [ ] ✅ RÉUSSI
- [ ] ❌ ÉCHOUÉ - Raison : _____________________

---

### ✅ TEST 3 : Bouton "Modifier le Stock"

#### Procédure
1. [ ] Aller sur la page **Stock**
2. [ ] Sélectionner un magasin dans le filtre
3. [ ] Observer chaque ligne de produit

#### Vérifications
Pour **CHAQUE** produit dans la liste :
- [ ] ✅ Bouton "Modifier" (icône crayon) **visible**
- [ ] Cliquer sur un bouton "Modifier" :
  - [ ] ✅ Modal s'ouvre
  - [ ] ✅ Champs "Quantité" et "Quantité initiale" modifiables
  - [ ] Modifier la quantité et enregistrer
  - [ ] ✅ Modification enregistrée avec succès

#### Test spécifique - Produit sans stock initial
1. [ ] Identifier un produit avec quantité = 0
2. [ ] Cliquer sur "Modifier"
3. [ ] ✅ Modal s'ouvre (pas d'erreur)
4. [ ] Entrer une quantité (ex: 10)
5. [ ] ✅ Stock créé avec succès

#### Résultat attendu
- Bouton visible sur 100% des produits
- Modification possible même pour stock = 0

#### Statut
- [ ] ✅ RÉUSSI
- [ ] ❌ ÉCHOUÉ - Raison : _____________________

---

### ✅ TEST 4 : Annulation Vente → Stock Recréditié

#### Prérequis
- [ ] Produit avec stock existant (ex: "Produit Test" avec 50 unités)

#### Procédure
1. [ ] Noter le stock initial du produit : _______ unités
2. [ ] Créer une vente de test :
   - Produit : Produit Test
   - Quantité : 10 unités
   - [ ] ✅ Vente enregistrée
3. [ ] Vérifier le stock après vente : _______ unités
   - [ ] ✅ Stock = (initial - 10)
4. [ ] **Annuler la vente**
5. [ ] Vérifier le stock après annulation : _______ unités
   - [ ] ✅ Stock = initial (recrédité)

#### Résultat attendu
- Stock initial : 50
- Après vente : 40
- Après annulation : **50** (recréditié)

#### Statut
- [ ] ✅ RÉUSSI
- [ ] ❌ ÉCHOUÉ - Raison : _____________________

---

### ✅ TEST 5 : Suppression Achat → Stock Décrémenté

#### Prérequis
- [ ] Rôle SUPER_ADMIN requis
- [ ] Produit avec stock existant

#### Procédure
1. [ ] Noter le stock initial du produit : _______ unités
2. [ ] Créer un achat de test :
   - Produit : Produit Test
   - Quantité : 20 unités
   - [ ] ✅ Achat enregistré
3. [ ] Vérifier le stock après achat : _______ unités
   - [ ] ✅ Stock = (initial + 20)
4. [ ] **Supprimer l'achat** (bouton poubelle)
5. [ ] Vérifier le stock après suppression : _______ unités
   - [ ] ✅ Stock = initial (décrémenté)

#### Résultat attendu
- Stock initial : 50
- Après achat : 70
- Après suppression : **50** (décrémenté)

#### Statut
- [ ] ✅ RÉUSSI
- [ ] ❌ ÉCHOUÉ - Raison : _____________________

---

### ✅ TEST 6 : Transferts Multi-Postes

#### Procédure
1. **PC 1** :
   - [ ] Créer un transfert entre magasins
   - [ ] ✅ Transfert enregistré

2. **PC 2** :
   - [ ] Aller sur page Transferts
   - [ ] ✅ Transfert visible immédiatement

3. [ ] Vérifier les stocks :
   - [ ] Stock magasin origine : décrémenté
   - [ ] Stock magasin destination : incrémenté

#### Statut
- [ ] ✅ RÉUSSI
- [ ] ❌ ÉCHOUÉ - Raison : _____________________

---

### ✅ TEST 7 : Performance Générale

#### Vérifications
- [ ] ✅ Page Ventes charge en < 2s
- [ ] ✅ Page Stock charge en < 3s
- [ ] ✅ Création vente en < 1s
- [ ] ✅ Aucune erreur console (F12)
- [ ] ✅ Aucun crash pendant 30 min d'utilisation

#### Statut
- [ ] ✅ RÉUSSI
- [ ] ❌ ÉCHOUÉ - Raison : _____________________

---

## 📊 Résumé des Tests

| Test | Statut | Note |
|------|--------|------|
| 1. Cache Multi-Postes | ☐ ✅ / ☐ ❌ | _________ |
| 2. Colonnes Ventes | ☐ ✅ / ☐ ❌ | _________ |
| 3. Modifier Stock | ☐ ✅ / ☐ ❌ | _________ |
| 4. Annulation Vente | ☐ ✅ / ☐ ❌ | _________ |
| 5. Suppression Achat | ☐ ✅ / ☐ ❌ | _________ |
| 6. Transferts | ☐ ✅ / ☐ ❌ | _________ |
| 7. Performance | ☐ ✅ / ☐ ❌ | _________ |

---

## ✅ Validation Globale

### Les corrections sont validées si :
- [ ] **7/7 tests réussis**
- [ ] Aucune régression détectée
- [ ] Performance acceptable

### Décision
- [ ] ✅ **VALIDÉ** - Prêt pour déploiement production
- [ ] ⚠️ **VALIDÉ AVEC RÉSERVES** - Détails : _____________
- [ ] ❌ **REJETÉ** - Retour en développement requis

---

## 📝 Notes & Observations

### Problèmes rencontrés :
_____________________________________________
_____________________________________________
_____________________________________________

### Améliorations suggérées :
_____________________________________________
_____________________________________________
_____________________________________________

---

**Signature Testeur** : _______________  
**Date & Heure** : _______________  
**Environnement** : ☐ Dev ☐ Standalone ☐ Portable
