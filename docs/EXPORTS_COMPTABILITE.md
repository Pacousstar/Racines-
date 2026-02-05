# Exports Excel et PDF - Comptabilité

**Date :** Février 2026  
**État :** ✅ **Complété**

---

## ✅ Exports Implémentés

### 1. Journaux Comptables
- ✅ **Export Excel** : `/api/journaux/export-excel`
  - Colonnes : Code, Libellé, Type, Statut
  - Filtre par type disponible
- ✅ **Export PDF** : `/api/journaux/export-pdf`
  - Format professionnel avec en-tête et pied de page
  - Filtre par type disponible

### 2. Écritures Comptables
- ✅ **Export Excel** : `/api/ecritures/export-excel`
  - Colonnes : Date, Numéro, Journal, Pièce, Libellé, Compte, Débit, Crédit, Référence, Type Réf., Utilisateur
  - Filtres : Date début/fin, Journal, Compte
- ✅ **Export PDF** : `/api/ecritures/export-pdf`
  - Format professionnel avec totaux
  - Filtres : Date début/fin, Journal, Compte

### 3. Grand Livre
- ✅ **Export Excel** : `/api/grand-livre/export-excel`
  - Groupé par compte avec en-têtes et totaux
  - Colonnes : Date, Numéro, Journal, Pièce, Libellé, Débit, Crédit, Solde
  - Filtres : Date début/fin, Compte
- ✅ **Export PDF** : `/api/comptabilite/export-pdf?type=grand-livre`
  - Déjà existant, format professionnel

### 4. Balance des Comptes
- ✅ **Export Excel** : `/api/balance/export-excel`
  - Groupé par classe avec totaux par classe
  - Colonnes : Classe, N° Compte, Libellé, Débit, Crédit, Solde
  - Totaux généraux inclus
  - Filtres : Date début/fin
- ✅ **Export PDF** : `/api/comptabilite/export-pdf?type=balance`
  - Déjà existant, format professionnel

---

## 📋 Utilisation

### Dans l'Interface Utilisateur

Tous les boutons d'export sont disponibles dans les pages correspondantes :

1. **Journaux** : Boutons "Excel" et "PDF" dans le header
2. **Écritures** : Boutons "Excel" et "PDF" dans le header
3. **Grand Livre** : Boutons "Excel" et "PDF" dans la section filtres
4. **Balance** : Boutons "Excel" et "PDF" dans la section filtres

### Format des Fichiers

- **Excel** : Format `.xlsx` avec colonnes ajustées automatiquement
- **PDF** : Format `.pdf` avec pagination automatique et en-têtes/pieds de page

---

## 🔧 Paramètres d'Export

### Journaux
- `type` : Filtre par type de journal (ACHATS, VENTES, BANQUE, CAISSE, OD)

### Écritures
- `dateDebut` : Date de début (format YYYY-MM-DD)
- `dateFin` : Date de fin (format YYYY-MM-DD)
- `journalId` : ID du journal (optionnel)
- `compteId` : ID du compte (optionnel)
- `limit` : Limite d'écritures (défaut : 5000 pour Excel, 1000 pour PDF)

### Grand Livre
- `dateDebut` : Date de début (format YYYY-MM-DD)
- `dateFin` : Date de fin (format YYYY-MM-DD)
- `compteId` : ID du compte (optionnel)

### Balance
- `dateDebut` : Date de début (format YYYY-MM-DD)
- `dateFin` : Date de fin (format YYYY-MM-DD)

---

## 📝 Notes Techniques

- Les exports respectent les filtres actifs dans l'interface
- Les totaux sont calculés automatiquement
- Les formats de nombres utilisent la locale française (espace pour milliers)
- Les fichiers sont téléchargés directement dans le navigateur

---

*Document créé lors de l'implémentation des exports comptables - Février 2026*
