# 📊 BASE DE DONNÉES - RÉSUMÉ COMPLET

**Date de génération** : 16 février 2026  
**Base analysée** : C:\gesticom\gesticom.db

---

## 📍 CHEMINS DES BASES DE DONNÉES

### 1. **BD PRODUCTION (source principale)**
```
C:\gesticom\gesticom.db
```
- **Taille** : ~2044 Ko (2 MB)
- **Utilisation** : PC de production, source pour les builds portables
- **Copie vers** : `GestiCom-Portable\data\gesticom.db` lors du build portable

### 2. **BD PORTABLE (copie autonome)**
```
GestiCom-Portable\data\gesticom.db
```
Au runtime, la BD est copiée vers :
```
C:\GestiCom-Portable\gesticom.db
```
- **Créée par** : Script `scripts/build-portable.js`
- **Source** : Copie exacte de `C:\gesticom\gesticom.db`
- **Utilisation** : Application portable autonome sur n'importe quel PC Windows

### 3. **BD LOCALE (développement)**
```
prisma\gesticom.db
```
- **Utilisation** : Tests en développement (`npm run dev`)
- **Non utilisée en production**

---

## 📊 CONTENU DÉTAILLÉ DE LA BASE DE DONNÉES

### 👥 **Utilisateurs & Configuration**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **Utilisateur** | 2 | Comptes utilisateurs (admin + 1 autre) |
| **Entite** | 1 | Entité juridique (entreprise GSN EXPERTISES GROUP) |
| **Magasin** | 11 | Points de vente/magasins (SIKASSO, BOUGOUNI, etc.) |
| **DashboardPreference** | 0 | Préférences dashboard (widgets, période) |
| **PrintTemplate** | 0 | Modèles d'impression personnalisés |

**Total utilisateurs** : 2  
**Total magasins** : 11

---

### 👥 **Tiers (Clients & Fournisseurs)**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **Client** | 2 | Base clients |
| **Fournisseur** | 0 | Base fournisseurs (vide) |

**Total tiers** : 2

---

### 📦 **Produits & Stock**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **Produit** | 3885 | Catalogue produits complet |
| **Stock** | 3365 | Lignes de stock (produit × magasin) |
| **Mouvement** | 117 | Historique mouvements stock (entrées/sorties/transferts) |

**Points clés** :
- 3885 produits dans le catalogue
- Stock réparti sur 11 magasins
- Moyenne : ~306 produits par magasin (3365 lignes / 11 magasins)
- 117 mouvements de stock enregistrés

---

### 💰 **Ventes & Achats**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **Vente** | **26** | ✅ Ventes enregistrées |
| **LigneVente** | N/A | Lignes de détail des ventes |
| **Achat** | **23** | Achats fournisseurs |
| **LigneAchat** | N/A | Lignes de détail des achats |

**Total transactions** : 49 (26 ventes + 23 achats)

---

### 🔄 **Transferts Entre Magasins**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **Transfert** | **0** | ❌ Aucun transfert enregistré |
| **LigneTransfert** | 0 | Lignes de détail des transferts |

**Statut** : ❌ Fonctionnalité en cours de correction (16 février 2026)

---

### 💵 **Trésorerie**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **Caisse** | 0 | Opérations de caisse |
| **Depense** | 6 | Dépenses diverses |
| **Charge** | 0 | Charges récurrentes |

**Total opérations trésorerie** : 6

---

### 📚 **Comptabilité**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **CompteComptable** | N/A | Plan comptable (comptes généraux) |
| **Journal** | 5 | Journaux comptables (VTE, ACH, BQ, etc.) |
| **EcritureComptable** | 110 | Écritures comptables automatiques |

**Points clés** :
- 5 journaux comptables configurés
- 110 écritures générées automatiquement
- Comptabilisation automatique : Ventes, Achats, Transferts, Dépenses

---

### 🔍 **Audit & Traçabilité**

| Table | Enregistrements | Description |
|-------|-----------------|-------------|
| **AuditLog** | 55 | Logs d'audit (actions utilisateurs) |

**Traçabilité** : 55 actions enregistrées (connexions, créations, modifications, suppressions)

---

## 📈 STATISTIQUES GLOBALES

| Catégorie | Total |
|-----------|-------|
| **Produits** | 3 885 |
| **Stocks** | 3 365 lignes |
| **Ventes** | 26 |
| **Achats** | 23 |
| **Transferts** | 0 ⚠️ |
| **Écritures comptables** | 110 |
| **Mouvements de stock** | 117 |
| **Magasins** | 11 |
| **Utilisateurs** | 2 |
| **Clients** | 2 |
| **Logs d'audit** | 55 |

---

## 🔄 SYNCHRONISATION DES BASES

### **Build Portable**
Lors de l'exécution de `npm run build:portable` :

1. ✅ Copie de `C:\gesticom\gesticom.db`
2. ✅ Vers `GestiCom-Portable\data\gesticom.db`
3. ✅ Garantit que les données sont à jour

**Convention** : La base portable utilise **TOUJOURS** la BD de production comme source.  
Voir : `docs/CONVENTION_BASE_PORTABLE.md`

---

## ⚠️ POINTS D'ATTENTION

### **1. Transferts**
- ❌ 0 transfert enregistré
- En cours de correction (16 février 2026)
- Problème : Modal stock insuffisant invisible (z-index)
- Solution : z-index augmenté à 9999

### **2. Fournisseurs**
- 0 fournisseur dans la base
- Achats enregistrés sans fournisseurs associés

### **3. Caisse**
- 0 opération de caisse
- Fonctionnalité potentiellement non utilisée

### **4. Charges**
- 0 charge récurrente
- Fonctionnalité potentiellement non utilisée

---

## 📌 INTÉGRITÉ DES DONNÉES

### **Données critiques présentes** ✅
- ✅ 3885 produits
- ✅ 3365 lignes de stock
- ✅ 26 ventes
- ✅ 23 achats
- ✅ 110 écritures comptables
- ✅ 117 mouvements de stock

### **Persistance garantie** ✅
- ✅ La base production est sauvegardée à `C:\gesticom\`
- ✅ Le portable copie toujours la base à jour
- ✅ Aucune perte de données lors des builds

---

## 🔗 FICHIERS LIÉS

- `docs/CONVENTION_BASE_PORTABLE.md` - Convention de copie de la BD
- `scripts/build-portable.js` - Script de build portable (ligne 200-208)
- `prisma/schema.prisma` - Schéma de la base de données
- `.env` - Configuration DATABASE_URL

---

**Dernière mise à jour** : 16 février 2026  
**Généré automatiquement** : Oui (via script Node.js avec better-sqlite3)
