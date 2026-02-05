# Guide Utilisateur - GestiCom Portable

## 🚀 Démarrage Rapide

### Première Utilisation

1. **Double-cliquez** sur **Lancer.vbs** (ou **Lancer.bat**)
2. Le navigateur s'ouvre automatiquement sur **http://localhost:3000**
3. **Connectez-vous** avec :
   - **Identifiant** : `admin`
   - **Mot de passe** : `Admin@123`
4. **Changez le mot de passe** immédiatement après la première connexion

### Utilisation Quotidienne

- **Démarrer** : Double-clic sur **Lancer.vbs**
- **Arrêter** : Fermer la fenêtre **Lancer.bat** (si visible) ou terminer **node.exe** dans le Gestionnaire des tâches

---

## 📋 Fonctionnalités Principales

### Gestion des Produits
- Créer, modifier, supprimer des produits
- Importer depuis Excel/CSV
- Gérer les catégories et prix

### Gestion des Stocks
- Voir les stocks par magasin
- Effectuer des inventaires
- Suivre les mouvements de stock

### Ventes
- Créer des ventes
- Gérer les clients
- Suivre les encaissements

### Achats
- Enregistrer les achats
- Gérer les fournisseurs
- Suivre les approvisionnements

### Comptabilité (Automatique)
- Les écritures comptables sont créées **automatiquement**
- Consulter le Grand Livre
- Consulter la Balance des Comptes
- Tout est conforme SYSCOHADA

### Rapports
- Alertes stock faible
- Top produits vendus
- Statistiques et analyses

---

## 💾 Sauvegarde des Données

### Sauvegarde Automatique
- Utilisez la fonction **Sauvegarde de la base** dans l'application (menu Paramètres)
- Les sauvegardes sont créées automatiquement

### Sauvegarde Manuelle
1. Fermez GestiCom proprement
2. Copiez le fichier `data/gesticom.db` vers un emplacement de sauvegarde
3. Nommez-le avec la date (ex. `gesticom-backup-2025-01-30.db`)

### Restaurer une Sauvegarde
1. Fermez GestiCom
2. Remplacez `data/gesticom.db` par votre fichier de sauvegarde
3. Relancez GestiCom

---

## ⚠️ Points Importants

- ✅ **Aucune connexion Internet requise** : Fonctionne entièrement hors ligne
- ✅ **Données locales** : Toutes vos données sont dans `data/gesticom.db`
- ⚠️ **Fermez proprement** : Ne tuez pas brutalement le processus, fermez via Lancer.bat
- ⚠️ **Une seule instance** : Ne lancez qu'une seule fois GestiCom sur un PC

---

## 🆘 Dépannage Rapide

### L'application ne démarre pas
- Vérifiez que `node.exe` est présent dans le dossier
- Vérifiez que `data/gesticom.db` existe
- Lancez **Lancer.bat** (au lieu de Lancer.vbs) pour voir les messages d'erreur

### Le navigateur ne s'ouvre pas
- Ouvrez manuellement votre navigateur
- Allez sur **http://localhost:3000**

### Erreur de connexion
- Vérifiez que GestiCom est bien lancé (fenêtre Lancer.bat visible)
- Attendez quelques secondes que le serveur démarre
- Réessayez de vous connecter

### Mot de passe oublié
- Contactez l'administrateur système
- Ou utilisez la base de données de développement pour réinitialiser

---

## 📞 Support

Pour toute question ou problème :
1. Consultez le fichier **README-Portable.txt** dans ce dossier
2. Consultez le **GUIDE_INSTALLATION_PORTABLE.md** pour plus de détails
3. Contactez le support technique avec :
   - Le message d'erreur exact
   - La version de Windows
   - L'emplacement du dossier GestiCom-Portable

---

**Bon usage de GestiCom !** 🎉
