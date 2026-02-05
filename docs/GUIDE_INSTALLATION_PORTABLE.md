# Guide d'Installation et d'Utilisation - GestiCom Portable

## 📦 Qu'est-ce que GestiCom Portable ?

GestiCom Portable est une version autonome de l'application qui peut être copiée sur une clé USB et utilisée sur n'importe quel PC Windows **sans installation** de Node.js ou d'autres dépendances. L'application fonctionne **entièrement hors ligne** (offline).

---

## 🚀 ÉTAPE 1 : Créer la Version Portable (sur le PC de développement)

### Prérequis
- Node.js installé sur le PC de développement
- Le projet GestiCom complet avec toutes les dépendances installées

### Instructions

1. **Ouvrir un terminal** dans le dossier du projet GestiCom (celui qui contient `package.json`)

2. **Construire la version portable** :
   ```bash
   npm run build:portable
   ```
   
   Cette commande va :
   - Compiler l'application Next.js
   - Générer la base de données SQLite
   - Créer le dossier **GestiCom-Portable** avec tous les fichiers nécessaires

3. **Télécharger Node.js portable** :
   - Aller sur : https://nodejs.org/dist/
   - Choisir la dernière version **LTS** (ex. `v20.18.0`)
   - Télécharger le fichier **`.zip`** pour Windows 64 bits
     - Exemple : `node-v20.18.0-win-x64.zip`

4. **Extraire node.exe** :
   - Ouvrir l'archive ZIP téléchargée
   - **Extraire uniquement le fichier `node.exe`**
   - Copier `node.exe` dans le dossier **GestiCom-Portable** (à côté de `Lancer.bat`)

5. **Vérifier le contenu** :
   Le dossier **GestiCom-Portable** doit contenir :
   ```
   GestiCom-Portable/
   ├── node.exe                    ← À ajouter manuellement
   ├── Lancer.bat                  ← Pour lancer avec fenêtre
   ├── Lancer.vbs                  ← Pour lancer sans fenêtre
   ├── portable-launcher.js
   ├── ensure-schema.js
   ├── server.js
   ├── .next/                      ← Dossier avec l'application compilée
   │   ├── server/
   │   └── static/
   ├── data/                       ← Dossier avec la base de données
   │   └── gesticom.db
   ├── public/                     ← Ressources publiques (logo, etc.)
   └── README-Portable.txt         ← Instructions rapides
   ```

✅ **Le dossier GestiCom-Portable est maintenant prêt à être copié !**

---

## 📤 ÉTAPE 2 : Transférer sur Clé USB ou Autre PC

### Option A : Clé USB (Recommandé)
1. Insérer une clé USB (minimum 500 Mo d'espace libre)
2. Copier **tout le dossier GestiCom-Portable** sur la clé USB
3. La clé peut maintenant être utilisée sur n'importe quel PC Windows

### Option B : Partage réseau / Cloud
- Copier le dossier via un partage réseau
- Ou utiliser OneDrive, Google Drive, etc.
- Puis copier sur le PC cible

### Option C : Disque externe
- Copier le dossier sur un disque dur externe
- Puis copier sur le PC cible

---

## 💻 ÉTAPE 3 : Installation sur le PC Utilisateur

### Première Installation

1. **Copier le dossier GestiCom-Portable** sur le PC utilisateur
   - **Recommandé** : `C:\GestiCom-Portable` ou `D:\GestiCom-Portable`
   - **Éviter** : Chemins avec espaces comme `C:\Program Files\...` ou `C:\Users\Mon Nom\...`

2. **Vérifier les fichiers essentiels** :
   - ✅ `node.exe` est présent
   - ✅ `Lancer.bat` et `Lancer.vbs` sont présents
   - ✅ Le dossier `data/` contient `gesticom.db`

3. **Lancer l'application** :
   - **Sans fenêtre de commande** : Double-clic sur **Lancer.vbs**
   - **Avec fenêtre** (pour voir les messages) : Double-clic sur **Lancer.bat**

4. **Le navigateur s'ouvre automatiquement** sur **http://localhost:3000**

5. **Première connexion** :
   - **Identifiant** : `admin`
   - **Mot de passe** : `Admin@123`
   - ⚠️ **Important** : Changez le mot de passe après la première connexion !

---

## 📖 ÉTAPE 4 : Utilisation Quotidienne

### Démarrer GestiCom
- Double-clic sur **Lancer.vbs** (recommandé, sans fenêtre)
- Ou double-clic sur **Lancer.bat** (pour voir les messages)

### Arrêter GestiCom
- **Méthode 1** : Fermer la fenêtre **Lancer.bat** si elle est ouverte
- **Méthode 2** : Ouvrir le Gestionnaire des tâches (Ctrl+Maj+Échap)
  - Chercher le processus **node.exe**
  - Cliquer droit → Terminer la tâche

⚠️ **Important** : Fermez toujours proprement (ne tuez pas brutalement le processus) pour que les données soient sauvegardées.

### Accéder à l'application
- L'application s'ouvre automatiquement sur **http://localhost:3000**
- Si ce n'est pas le cas, ouvrir manuellement cette adresse dans votre navigateur

---

## 💾 Gestion des Données

### Où sont stockées les données ?

- **Chemin normal** (sans espaces) : `GestiCom-Portable/data/gesticom.db`
- **Chemin avec espaces** : `C:\gesticom_portable_data\gesticom.db`
  - Le launcher copie automatiquement la base vers C:\ si le chemin contient des espaces
  - Les données sont resynchronisées à l'arrêt

### Sauvegarde des données

1. **Sauvegarde manuelle** :
   - Fermer GestiCom proprement
   - Copier le fichier `data/gesticom.db` vers un emplacement de sauvegarde

2. **Sauvegarde automatique** :
   - Utiliser la fonction **Sauvegarde de la base** dans l'application (menu Paramètres)
   - Les sauvegardes sont créées dans le dossier de l'application

### Restaurer une sauvegarde

1. Fermer GestiCom
2. Remplacer `data/gesticom.db` par votre fichier de sauvegarde
3. Relancer GestiCom

---

## 🔄 Mise à Jour de GestiCom Portable

Quand une nouvelle version est disponible :

1. **Sur le PC de développement** :
   ```bash
   npm run build:portable
   ```

2. **Sauvegarder les données existantes** :
   - Sur le PC utilisateur, copier `data/gesticom.db` vers un emplacement sûr

3. **Remplacer le dossier GestiCom-Portable** :
   - Supprimer l'ancien dossier (ou le renommer en sauvegarde)
   - Copier le nouveau dossier GestiCom-Portable
   - **Remettre `node.exe`** dans le nouveau dossier

4. **Restaurer les données** :
   - Copier votre sauvegarde `gesticom.db` dans `data/`

5. **Relancer** : Double-clic sur **Lancer.vbs**

---

## 🛠️ Dépannage

### Problème : "node.exe manquant"
**Solution** : 
- Télécharger Node.js LTS (zip) depuis https://nodejs.org/dist/
- Extraire `node.exe` dans le dossier GestiCom-Portable

### Problème : "data\gesticom.db manquant"
**Solution** :
- Refaire un `npm run build:portable` sur le PC de développement
- Recopier le dossier `data/` complet

### Problème : "Erreur serveur" / Table manquante
**Solution** :
- Fermer GestiCom
- Au prochain lancement, `ensure-schema.js` mettra à jour la base automatiquement
- Si le problème persiste, sur le PC de dev : `npm run portable:copy-db`
- Puis recopier `data/gesticom.db` dans GestiCom-Portable

### Problème : Le navigateur ne s'ouvre pas
**Solution** :
- Ouvrir manuellement votre navigateur
- Aller sur **http://localhost:3000**

### Problème : Port 3000 déjà utilisé
**Solution** :
- Fermer l'autre application qui utilise le port 3000
- Ou le launcher tentera automatiquement le port 3001
- Dans ce cas, ouvrir **http://localhost:3001**

### Problème : "Unable to open the database file"
**Solution** :
- Déplacer GestiCom-Portable vers un chemin **sans espaces** (ex. `C:\GestiCom-Portable`)
- Ou exécuter en tant qu'administrateur

### Problème : L'application ne démarre pas
**Solution** :
1. Vérifier que `node.exe` est présent
2. Vérifier que `data/gesticom.db` existe
3. Lancer `Lancer.bat` (au lieu de `Lancer.vbs`) pour voir les messages d'erreur
4. Vérifier les permissions du dossier (lecture/écriture)

---

## 📋 Checklist de Déploiement

### Avant de distribuer aux utilisateurs

- [ ] Build portable créé (`npm run build:portable`)
- [ ] `node.exe` ajouté dans GestiCom-Portable
- [ ] Test de lancement effectué (Lancer.vbs fonctionne)
- [ ] Base de données initialisée avec compte admin
- [ ] Test de connexion réussi (admin / Admin@123)
- [ ] Documentation fournie aux utilisateurs

### Contenu du package à distribuer

- [ ] Dossier GestiCom-Portable complet
- [ ] `node.exe` inclus
- [ ] `data/gesticom.db` présent
- [ ] Ce guide d'installation (GUIDE_INSTALLATION_PORTABLE.md)
- [ ] README-Portable.txt (instructions rapides)

---

## 🎯 Utilisation par les Utilisateurs

### Première Utilisation

1. **Copier** le dossier GestiCom-Portable sur le PC
2. **Double-clic** sur **Lancer.vbs**
3. **Se connecter** avec :
   - Identifiant : `admin`
   - Mot de passe : `Admin@123`
4. **Changer le mot de passe** immédiatement (Paramètres → Utilisateurs)

### Utilisation Quotidienne

1. **Démarrer** : Double-clic sur **Lancer.vbs**
2. **Utiliser** l'application normalement
3. **Arrêter** : Fermer la fenêtre Lancer.bat ou terminer node.exe dans le Gestionnaire des tâches

### Fonctionnalités Disponibles

- ✅ Gestion des produits et stocks
- ✅ Gestion des clients et fournisseurs
- ✅ Ventes et achats
- ✅ Dépenses et charges
- ✅ Caisse
- ✅ Comptabilité SYSCOHADA (automatique)
- ✅ Rapports et statistiques
- ✅ Sauvegarde de la base de données

---

## 🔒 Sécurité et Bonnes Pratiques

1. **Changer le mot de passe admin** après la première connexion
2. **Créer des utilisateurs** avec des rôles appropriés (COMPTABLE, VENDEUR, etc.)
3. **Sauvegarder régulièrement** la base de données
4. **Ne pas partager** le dossier GestiCom-Portable avec des personnes non autorisées
5. **Protéger** la clé USB ou le dossier contenant GestiCom-Portable

---

## 📞 Support

En cas de problème :

1. Consulter la section **Dépannage** ci-dessus
2. Vérifier les messages d'erreur dans **Lancer.bat** (si lancé avec fenêtre)
3. Consulter le fichier **README-Portable.txt** dans le dossier GestiCom-Portable
4. Contacter le support technique avec :
   - Le message d'erreur exact
   - La version de Windows
   - L'emplacement du dossier GestiCom-Portable

---

## 📝 Notes Importantes

- ✅ **Aucune connexion Internet requise** : L'application fonctionne entièrement hors ligne
- ✅ **Aucune installation nécessaire** : Tout est contenu dans le dossier GestiCom-Portable
- ✅ **Portable** : Peut être déplacé sur n'importe quel PC Windows
- ✅ **Données locales** : Toutes les données sont stockées localement dans `data/gesticom.db`
- ⚠️ **Windows uniquement** : Cette version portable est conçue pour Windows
- ⚠️ **Une seule instance** : Ne lancez qu'une seule instance de GestiCom à la fois sur un PC

---

## 🎉 Résumé Rapide

### Pour créer la version portable :
```bash
npm run build:portable
# Puis ajouter node.exe dans GestiCom-Portable
```

### Pour utiliser sur un autre PC :
1. Copier le dossier GestiCom-Portable
2. Double-clic sur Lancer.vbs
3. Se connecter avec admin / Admin@123

**C'est tout !** 🚀
