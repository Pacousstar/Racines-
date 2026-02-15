# Guide de Déploiement - Corrections GestiCom 15/02/2026

## 🎯 Objectif
Déployer les corrections critiques de GestiCom en production sur tous les postes utilisateurs.

---

## 📋 Corrections Incluses dans ce Déploiement

### ✅ **Correction #1 : Cache Multi-Postes**
- **Problème résolu** : Enregistrements invisibles sur autres PC
- **Fichiers modifiés** : 11 APIs (ventes, achats, stock, etc.)
- **Impact** : Affichage immédiat sans F5

### ✅ **Correction #2 : Colonnes Ventes**
- **Problème résolu** : "Statut paiement" et "Reste à payer" manquants
- **Fichier modifié** : Page ventes
- **Impact** : Affichage complet des informations de paiement

### ✅ **Correction #3 : Bouton Modifier Stock**
- **Problème résolu** : Certains produits non modifiables
- **Fichier modifié** : Page stock
- **Impact** : Tous les produits modifiables

### ✅ **Correction #4 : Annulations Stock**
- **Vérification** : Stock recréditié automatiquement
- **Impact** : Cohérence des stocks garantie

---

## 🚀 Procédure de Déploiement

### **ÉTAPE 1 : Sauvegarde de Sécurité**

#### Sur le PC de développement :
```bash
# 1. Sauvegarder la base de données actuelle
npm run db:backup

# 2. Sauvegarder le code actuel (si Git non utilisé)
# Copier tout le dossier gesticom vers gesticom_backup_avant_correction
```

#### Sur le PC de production :
```bash
# Sauvegarder C:\gesticom\gesticom.db
Copy-Item "C:\gesticom\gesticom.db" "C:\gesticom\gesticom_backup_15_02_2026.db"
```

---

### **ÉTAPE 2 : Déploiement des Corrections**

#### **Option A : Mode Développement (PC principal)**

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier le schéma de base
npx prisma db push

# 3. Lancer en mode développement
npm run dev
```

**Tester** : http://localhost:3000
- [ ] Créer une vente → Vérifier colonnes
- [ ] Modifier un stock → Tous produits accessibles

---

#### **Option B : Mode Production Standalone**

```bash
# 1. Build de production
npm run build

# 2. Lancer le serveur standalone
npm run start:standalone
```

**Tester** : http://localhost:3000
- [ ] Créer une vente
- [ ] Ouvrir un autre navigateur → Vente visible sans F5

---

#### **Option C : Version Portable (Clé USB)**

```bash
# 1. Créer le build portable
npm run build:portable

# 2. Le dossier GestiCom-Portable est créé
# 3. Copier sur clé USB
# 4. Sur le PC cible : Double-clic sur Lancer.bat
```

**Note** : La base portable sera dans `data/gesticom.db`

---

### **ÉTAPE 3 : Tests Multi-Postes OBLIGATOIRES**

#### Test Cache (Critique)
1. **PC 1** : Créer une nouvelle vente
2. **PC 2** : Actualiser la page ventes
3. **Vérification** : La vente apparaît immédiatement ✅

#### Test Colonnes Ventes
1. Ouvrir la page Ventes
2. Vérifier la présence des colonnes :
   - ✅ "Statut paiement" (Payé/Partiel/Crédit)
   - ✅ "Reste à payer" (montant en FCFA)

#### Test Stock
1. Aller sur la page Stock
2. Pour chaque produit :
   - ✅ Bouton "Modifier" visible (icône crayon)
3. Cliquer sur "Modifier" :
   - ✅ Modal s'ouvre avec quantité modifiable

#### Test Annulation
1. Créer une vente de test (noter le stock avant)
2. Annuler la vente
3. Vérifier le stock :
   - ✅ Stock recréditié automatiquement

---

## 🔧 Dépannage

### **Problème : "Ventes ne s'affichent pas immédiatement"**
**Cause** : Cache navigateur  
**Solution** :
```bash
# Vider le cache Next.js
rm -rf .next
npm run build
npm run start:standalone
```

### **Problème : "Colonnes Ventes toujours absentes"**
**Cause** : Build non à jour  
**Solution** :
```bash
# Rebuild complet
npm run build
# Redémarrer le serveur
```

### **Problème : "Bouton Modifier invisible"**
**Cause** : Code frontend non rechargé  
**Solution** :
- Forcer le rafraîchissement : `Ctrl + Shift + R`
- Ou vider le cache navigateur

### **Problème : "Base de données verrouillée"**
**Solution** :
```bash
# Arrêter tous les processus Node
taskkill /F /IM node.exe
# Relancer
npm run start:standalone
```

---

## ✅ Checklist de Validation Post-Déploiement

### Sur CHAQUE poste utilisateur :

#### Tests Fonctionnels
- [ ] **Ventes** : Créer vente → Colonnes visibles
- [ ] **Stock** : Modifier un produit → Bouton accessible
- [ ] **Cache** : Enregistrement sur PC1 → Visible sur PC2
- [ ] **Annulation** : Annuler vente → Stock recréditié

#### Tests de Stabilité
- [ ] Application démarre sans erreur
- [ ] Connexion multi-utilisateurs stable
- [ ] Pas de ralentissement
- [ ] Base de données accessible

#### Tests Réseau Local (si applicable)
- [ ] PC1 : http://192.168.X.X:3000 accessible
- [ ] PC2 : Créer vente sur PC1 → Visible sur PC2
- [ ] Aucun délai > 2 secondes

---

## 📊 Rollback (En cas de problème)

### Si les corrections posent problème :

#### Mode Développement
```bash
# Restaurer la base
Copy-Item "prisma/backup_*.db" "prisma/gesticom.db"
# Redémarrer
npm run dev
```

#### Mode Production
```bash
# Restaurer la base de production
Copy-Item "C:\gesticom\gesticom_backup_15_02_2026.db" "C:\gesticom\gesticom.db"
# Redémarrer
npm run start:standalone
```

---

## 🎯 Indicateurs de Succès

### ✅ Le déploiement est réussi si :
1. **Cache** : Enregistrements visibles immédiatement sur tous les PC
2. **Ventes** : Les 2 colonnes (Statut paiement, Reste à payer) affichées
3. **Stock** : Bouton "Modifier" visible sur 100% des produits
4. **Annulations** : Stock cohérent après annulation vente/achat
5. **Stabilité** : Aucune erreur console, aucun crash
6. **Performance** : Temps de réponse < 2s

---

## 📞 Support

### En cas de problème lors du déploiement :

1. **Vérifier les logs** :
   ```bash
   # Logs serveur (dans le terminal)
   # Logs navigateur (F12 → Console)
   ```

2. **Consulter la documentation** :
   - `docs/CORRECTIONS_STABILISATION.md` - Détails corrections
   - `README.md` - Installation de base

3. **Restaurer la sauvegarde** (voir section Rollback)

---

## 📅 Planning Recommandé

### Déploiement Progressive (Recommandé)

#### **Jour 1 - PC Principal (Développement)**
- Déployer les corrections
- Tests complets (1-2 heures)
- Validation par l'équipe

#### **Jour 2 - PC Secondaires (Test)**
- Déployer sur 1-2 postes tests
- Tests multi-postes (2-3 heures)
- Validation cache temps réel

#### **Jour 3 - Tous les Postes**
- Déploiement général
- Formation utilisateurs (10 min)
- Support actif première journée

---

## 🎓 Formation Utilisateurs (5 minutes)

### Nouveautés à communiquer :

1. **Ventes** : 
   - "Vous voyez maintenant le statut de paiement et le reste à payer directement dans la liste"
   
2. **Stock** :
   - "Tous les produits peuvent être modifiés, même ceux sans stock initial"

3. **Multi-postes** :
   - "Les enregistrements apparaissent immédiatement sur tous les PC, plus besoin de rafraîchir"

4. **Annulations** :
   - "Le stock est automatiquement recréditié lors d'une annulation"

---

**Date de création** : 15/02/2026  
**Version GestiCom** : Corrections Stabilisation v1.0  
**Auteur** : MonAP - Chef de Projet Technique
