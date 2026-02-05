# Guide de Restauration de Base de Données GestiCom

Ce guide explique comment récupérer une sauvegarde de la base de données GestiCom depuis un autre PC et la restaurer dans votre version portable.

---

## 📋 Table des matières

1. [Où trouver la base de données sur l'autre PC](#1-où-trouver-la-base-de-données-sur-lautre-pc)
2. [Méthode 1 : Restauration depuis GestiCom-Portable](#méthode-1--restauration-depuis-gesticom-portable)
3. [Méthode 2 : Restauration depuis C:\gesticom_portable_data](#méthode-2--restauration-depuis-cgesticom_portable_data)
4. [Méthode 3 : Restauration depuis les sauvegardes automatiques](#méthode-3--restauration-depuis-les-sauvegardes-automatiques)
5. [Méthode 4 : Restauration depuis une sauvegarde manuelle](#méthode-4--restauration-depuis-une-sauvegarde-manuelle)
6. [Vérification après restauration](#vérification-après-restauration)
7. [Dépannage](#dépannage)

---

## 1. Où trouver la base de données sur l'autre PC

La base de données GestiCom peut se trouver à plusieurs emplacements selon la configuration :

### Emplacements possibles :

1. **Dans GestiCom-Portable** (si le portable était sur une clé USB ou un dossier local) :
   ```
   GestiCom-Portable\data\gesticom.db
   ```

2. **Sur le disque C:** (si le portable était lancé depuis un chemin avec espaces) :
   ```
   C:\gesticom_portable_data\gesticom.db
   ```

3. **Dans le projet de développement** (si c'était une version de développement) :
   ```
   GestiCom-master\prisma\gesticom.db
   ```

4. **Sauvegardes automatiques** (créées lors des builds) :
   ```
   GestiCom-master\backup-portable-data-YYYYMMDDHHmm.db
   GestiCom-master\backup-portable-C-drive-YYYYMMDDHHmm.db
   ```

---

## Méthode 1 : Restauration depuis GestiCom-Portable

### Sur le PC source (celui qui a les données) :

1. **Localiser le fichier** :
   - Ouvrir l'Explorateur Windows
   - Naviguer vers le dossier `GestiCom-Portable`
   - Aller dans le sous-dossier `data`
   - Chercher le fichier `gesticom.db`

2. **Copier le fichier** :
   - Clic droit sur `gesticom.db` → **Copier**
   - Ou sélectionner le fichier et appuyer sur `Ctrl + C`

3. **Transférer vers le nouveau PC** :
   - Copier sur une **clé USB**, un **disque externe**, ou via un **partage réseau**
   - Ou envoyer par **email** (si le fichier n'est pas trop volumineux)
   - Ou utiliser un **service cloud** (Google Drive, OneDrive, Dropbox, etc.)

### Sur le PC cible (nouveau GestiCom-Portable) :

1. **Arrêter GestiCom** (si en cours d'exécution) :
   - Fermer toutes les fenêtres de GestiCom
   - Fermer la fenêtre de commande si elle est ouverte

2. **Remplacer la base de données** :
   - Ouvrir l'Explorateur Windows
   - Naviguer vers `GestiCom-Portable\data`
   - **Renommer** le fichier `gesticom.db` existant en `gesticom.db.old` (sauvegarde de sécurité)
   - **Coller** le fichier `gesticom.db` copié depuis l'autre PC dans ce dossier

3. **Relancer GestiCom** :
   - Double-cliquer sur `Lancer.bat` ou `Lancer.vbs`
   - Se connecter avec vos identifiants
   - Vérifier que vos données sont présentes

---

## Méthode 2 : Restauration depuis C:\gesticom_portable_data

Si GestiCom était lancé depuis un chemin avec espaces, la base peut être sur le disque C:.

### Sur le PC source :

1. **Ouvrir l'Explorateur Windows**
2. **Naviguer vers** : `C:\gesticom_portable_data`
3. **Vérifier** si le fichier `gesticom.db` existe
4. **Copier** ce fichier vers votre support de transfert (clé USB, etc.)

### Sur le PC cible :

1. **Arrêter GestiCom** (si en cours d'exécution)
2. **Copier** le fichier `gesticom.db` vers `GestiCom-Portable\data\gesticom.db`
3. **Relancer** GestiCom

---

## Méthode 3 : Restauration depuis les sauvegardes automatiques

Si vous avez fait des builds de la version portable, des sauvegardes automatiques ont été créées.

### Localiser les sauvegardes :

1. **Dans le projet GestiCom** (si vous avez accès au code source) :
   - Ouvrir le dossier `GestiCom-master`
   - Chercher les fichiers commençant par `backup-portable-data-` ou `backup-portable-C-drive-`
   - Les fichiers sont nommés avec la date et l'heure : `backup-portable-data-202602030452.db`

2. **Choisir la sauvegarde la plus récente** :
   - Les fichiers sont triés par date de modification
   - Choisir celui qui correspond à la dernière fois où vous avez utilisé GestiCom

### Restaurer la sauvegarde :

1. **Copier** le fichier de sauvegarde (ex. `backup-portable-data-202602030452.db`)
2. **Le renommer** en `gesticom.db`
3. **Le placer** dans `GestiCom-Portable\data\` (remplacer l'ancien fichier)
4. **Relancer** GestiCom

---

## Méthode 4 : Restauration depuis une sauvegarde manuelle

Si vous avez créé une sauvegarde manuelle de la base de données :

1. **Localiser** votre fichier de sauvegarde (peut avoir n'importe quel nom, ex. `ma-sauvegarde.db`, `gesticom-backup.db`, etc.)
2. **Copier** ce fichier vers `GestiCom-Portable\data\`
3. **Renommer** en `gesticom.db` (remplacer l'ancien)
4. **Relancer** GestiCom

---

## Vérification après restauration

Après avoir restauré la base de données, vérifiez que tout fonctionne :

1. **Se connecter** à GestiCom avec vos identifiants
2. **Vérifier les données** :
   - Aller dans **Ventes** → vérifier que vos ventes sont présentes
   - Aller dans **Achats** → vérifier que vos achats sont présentes
   - Aller dans **Produits** → vérifier que vos produits sont présents
   - Aller dans **Clients** → vérifier que vos clients sont présents
   - Aller dans **Stock** → vérifier que les quantités sont correctes
   - Aller dans **Rapports** → vérifier que les statistiques sont cohérentes

3. **Vérifier la cohérence** :
   - Les totaux doivent correspondre à vos attentes
   - Les dates doivent être correctes
   - Les montants doivent être cohérents

---

## Dépannage

### Problème : "La base de données est verrouillée"

**Solution** :
1. Fermer complètement GestiCom (toutes les fenêtres)
2. Attendre quelques secondes
3. Réessayer de copier le fichier

### Problème : "Erreur lors de l'ouverture de la base"

**Solution** :
1. Vérifier que le fichier `gesticom.db` n'est pas corrompu
2. Essayer une autre sauvegarde (plus récente ou plus ancienne)
3. Vérifier que le fichier n'est pas vide (taille > 0)

### Problème : "Les données ne sont pas présentes après restauration"

**Solutions possibles** :
1. Vérifier que vous avez copié le bon fichier (celui qui contient vos données)
2. Vérifier que le fichier est bien nommé `gesticom.db` (pas `gesticom.db.old` ou autre)
3. Vérifier que le fichier est dans le bon dossier : `GestiCom-Portable\data\`
4. Essayer de restaurer une autre sauvegarde

### Problème : "Erreur de schéma de base de données"

**Solution** :
Si le schéma de la base a évolué (nouvelles tables, colonnes), le launcher devrait automatiquement mettre à jour le schéma au démarrage. Si ce n'est pas le cas :
1. Vérifier que vous utilisez la même version de GestiCom
2. Contacter le support si le problème persiste

---

## 💡 Conseils de prévention

Pour éviter de perdre vos données à l'avenir :

1. **Faire des sauvegardes régulières** :
   - Copier manuellement `GestiCom-Portable\data\gesticom.db` vers un emplacement sûr
   - Utiliser un nom avec la date : `gesticom-backup-2025-02-03.db`

2. **Utiliser plusieurs emplacements** :
   - Sauvegarder sur une clé USB
   - Sauvegarder sur un disque externe
   - Sauvegarder sur un service cloud

3. **Avant chaque build** :
   - Le script `build:portable` fait automatiquement des sauvegardes
   - Mais vous pouvez aussi faire une sauvegarde manuelle pour plus de sécurité

---

## 📞 Support

Si vous rencontrez des problèmes lors de la restauration :

1. Vérifier que vous avez suivi toutes les étapes
2. Vérifier que les fichiers ne sont pas corrompus
3. Essayer avec une autre sauvegarde
4. Consulter les logs dans la fenêtre de commande lors du lancement

---

**Dernière mise à jour** : Février 2025
