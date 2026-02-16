# Guide de Gestion des Bases de Données - GestiCom

## 📋 Vue d'ensemble

Ce guide documente l'ensemble des scripts de gestion des bases de données pour GestiCom. Ces scripts permettent de gérer facilement les différentes bases de données (Production, Locale, Portable) et de créer des builds portables.

## 📍 Emplacements des bases de données

| Base | Emplacement | Usage |
|------|-------------|-------|
| **Production** | `C:\gesticom\gesticom.db` | Base de données principale en production |
| **Locale** | `prisma\gesticom.db` | Base de données locale du projet (développement) |
| **Portable** | `GestiCom-Portable\data\gesticom.db` | Base pour la version portable |
| **Sauvegardes** | `C:\gesticom\backups\` | Dossier des sauvegardes automatiques |

## 🛠️ Scripts disponibles

### 1. **gestionbases.bat** - Menu principal ⭐

**Usage :** Double-cliquez sur le fichier ou exécutez `gestionbases.bat`

Menu interactif proposant toutes les fonctionnalités :
```
1. Afficher l'état des bases
2. Comparer les bases
3. Sauvegarder la base de production
4. Restaurer une sauvegarde
5. Fixer/Mettre à jour la base portable
6. Build portable
7. Package portable (créer ZIP)
8. Build + Package (tout-en-un)
0. Quitter
```

**Recommandé pour :** Utilisateurs préférant une interface guidée.

---

### 2. **afficherbase.bat** - Affichage de l'état

**Usage :** `afficherbase.bat`

Affiche l'état et les informations de toutes les bases de données :
- Chemin complet
- Taille en octets
- Date de dernière modification

**Exemple de sortie :**
```
[✓] Base de PRODUCTION : C:\gesticom\gesticom.db
    Taille : 2093056 octets
    Modifie : 15/02/2026 21:39

[✓] Base LOCALE projet : ...\prisma\gesticom.db
    Taille : 1728512 octets
    Modifie : 09/02/2026 15:02

[✓] Base PORTABLE : ...\GestiCom-Portable\data\gesticom.db
    Taille : 2093056 octets
    Modifie : 15/02/2026 21:39
```

---

### 3. **comparerbases.bat** - Comparaison des bases

**Usage :** `comparerbases.bat`

Compare les trois bases de données et indique leur état de synchronisation.

**Fonctionnalités :**
- Détecte les bases présentes/absentes
- Affiche les détails (taille, date)
- Compare PORTABLE vs PRODUCTION
- Compare LOCALE vs PRODUCTION
- Suggère des actions si nécessaire

**Exemple de sortie :**
```
========================================
  ANALYSE DE SYNCHRONISATION
========================================

[✓] PORTABLE = PRODUCTION tailles identiques

[!] LOCALE different de PRODUCTION tailles differentes
```

---

### 4. **sauvegarderbase.bat** - Sauvegarde automatique

**Usage :** `sauvegarderbase.bat`

Sauvegarde la base de production avec horodatage automatique.

**Fonctionnalités :**
- Crée une sauvegarde horodatée dans `C:\gesticom\backups\`
- Format : `gesticom_AAAA-MM-JJ_HH-MM.db`
- Conserve automatiquement les 10 dernières sauvegardes
- Supprime les anciennes sauvegardes automatiquement

**Exemple de sortie :**
```
[✓] Sauvegarde créée avec succès !

    Fichier : gesticom_-2026-02_04-38.db
    Chemin : C:\gesticom\backups\gesticom_-2026-02_04-38.db
    Taille : 2093056 octets

[i] Nettoyage des anciennes sauvegardes conservees: 10 dernieres...
```

**Recommandation :** Exécutez ce script avant toute opération importante (restauration, migration, etc.).

---

### 5. **restaurerbase.bat** - Restauration de sauvegarde

**Usage :** `restaurerbase.bat`

Restaure une sauvegarde de la base de production.

**Fonctionnalités :**
- Liste toutes les sauvegardes disponibles
- Permet de choisir quelle sauvegarde restaurer
- Demande confirmation avant restauration
- Sauvegarde automatiquement l'état actuel avant restauration

**Processus interactif :**
```
Sauvegardes disponibles :

1. gesticom_-2026-02_04-37.db
2. gesticom_-2026-02_04-38.db
3. gesticom_-2026-02_04-36.db

Entrez le numéro de la sauvegarde à restaurer (1-3) : _
```

**⚠️ Attention :** Cette opération remplace la base de production actuelle !

---

### 6. **fixerbaseportable.bat** - Synchronisation portable

**Usage :** `fixerbaseportable.bat`

Copie la base de production vers le dossier portable.

**Fonctionnalités :**
- Vérifie que la base de production existe
- Crée le dossier `GestiCom-Portable\data` si nécessaire
- Copie la base de production vers le portable
- Affiche les détails de la copie

**Quand l'utiliser :**
- Avant de créer un build portable
- Après avoir modifié la base de production
- Pour synchroniser les données vers le portable

**Exemple de sortie :**
```
[✓] Base portable mise à jour avec succès !

Détails de la base portable :
    Chemin : ...\GestiCom-Portable\data\gesticom.db
    Taille : 2093056 octets
    Modifié : 15/02/2026 21:39
```

---

### 7. **npm run package:portable** - Création du ZIP

**Usage :** `npm run package:portable`

Crée une archive ZIP de `GestiCom-Portable` pour distribution.

**Fonctionnalités :**
- Crée un ZIP horodaté : `GestiCom-Portable_AAAA-MM-JJ_HH-MM.zip`
- Gère correctement les espaces dans les chemins utilisateur
- Compresse tout le dossier `GestiCom-Portable`

**Prérequis :** Le dossier `GestiCom-Portable` doit exister (créé par `npm run build:portable`)

**Exemple de sortie :**
```
Packaging GestiCom-Portable → GestiCom-Portable_2026-02-16_04-30.zip
✓ ZIP créé: GestiCom-Portable_2026-02-16_04-30.zip (4 MB)
Vous pouvez maintenant transférer ce fichier sur un autre PC.
```

---

## 🚀 Workflows recommandés

### Workflow 1 : Création d'un build portable complet

```batch
# Option A : Via le menu (recommandé)
gestionbases.bat
# → Choisir option 8 (Build + Package tout-en-un)

# Option B : Manuellement
sauvegarderbase.bat      # 1. Sauvegarde de sécurité
fixerbaseportable.bat    # 2. Synchronisation base portable
npm run build:portable   # 3. Build de la version portable
npm run package:portable # 4. Création du ZIP
```

### Workflow 2 : Vérification quotidienne

```batch
afficherbase.bat         # Voir l'état des bases
comparerbases.bat        # Vérifier la synchronisation
```

### Workflow 3 : Mise à jour de la base portable

```batch
fixerbaseportable.bat    # Synchroniser avec production
npm run build:portable   # Rebuild
npm run package:portable # Nouveau ZIP
```

### Workflow 4 : Sauvegarde et restauration

```batch
# Sauvegarde avant modification importante
sauvegarderbase.bat

# ... effectuer les modifications ...

# En cas de problème, restaurer
restaurerbase.bat
```

---

## 📊 Commandes NPM

| Commande | Description |
|----------|-------------|
| `npm run build:portable` | Crée le build portable dans `GestiCom-Portable/` |
| `npm run package:portable` | Crée le ZIP du portable (après build) |

---

## ⚙️ Configuration technique

### Scripts batch
- **Encodage :** UTF-8 (chcp 65001)
- **Variables retardées :** Activées (`setlocal enabledelayedexpansion`)
- **Gestion des espaces :** Tous les scripts gèrent correctement les espaces dans les chemins

### Script JavaScript (zip-portable.js)
- **Plateforme :** Windows, macOS, Linux
- **Windows :** Utilise `PowerShell Compress-Archive`
- **macOS/Linux :** Utilise `zip -r`
- **Gestion des espaces :** Guillemets simples PowerShell (`'chemin'`)

---

## 🔧 Dépannage

### Problème : "Base de production introuvable"
**Solution :** Vérifiez que `C:\gesticom\gesticom.db` existe.

### Problème : "Erreur lors de la création du ZIP"
**Solutions :**
1. Vérifiez que `GestiCom-Portable/` existe
2. Exécutez d'abord `npm run build:portable`
3. Vérifiez les permissions d'écriture

### Problème : "Les bases ne sont pas synchronisées"
**Solution :** Exécutez `fixerbaseportable.bat`

### Problème : "Aucune sauvegarde disponible"
**Solution :** 
1. Créez une sauvegarde avec `sauvegarderbase.bat`
2. Vérifiez que `C:\gesticom\backups\` existe

---

## 📝 Notes importantes

### Sauvegardes
- Les sauvegardes sont stockées dans `C:\gesticom\backups\`
- Seules les 10 dernières sauvegardes sont conservées
- Une sauvegarde automatique est créée avant chaque restauration

### Synchronisation
- La base PORTABLE doit toujours être synchronisée avec PRODUCTION avant un build
- Utilisez `comparerbases.bat` pour vérifier l'état de synchronisation

### Builds portables
- Le build portable utilise toujours la base dans `GestiCom-Portable\data\`
- Assurez-vous que cette base est à jour avant le build

### Convention
- Base de production : **toujours** `C:\gesticom\gesticom.db`
- Base portable : **toujours** copiée depuis la production
- Détails : Voir `docs/CONVENTION_BASE_PORTABLE.md`

---

## 🔗 Références

- **Convention base portable :** `docs/CONVENTION_BASE_PORTABLE.md`
- **Guide démarrage :** `GUIDE_DEMARRAGE.md`
- **Build portable :** `docs/BUILD_PORTABLE_FINAL_15_FEV_2026.md`

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez ce guide
2. Utilisez `comparerbases.bat` pour diagnostiquer
3. Consultez les logs d'erreur

---

**Dernière mise à jour :** 16 février 2026  
**Version :** 1.0  
**Auteur :** MonAP - Chef de projet technique
