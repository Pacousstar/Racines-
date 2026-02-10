# Configuration Réseau Local - GestiCom Portable

**Date :** 6 Février 2026  
**Version :** 1.0.0

---

## 🎯 Objectif

Permettre à plusieurs PC sur le même réseau local d'accéder à GestiCom-Portable simultanément.

---

## 📋 Prérequis

- **PC Serveur** : Un PC qui hébergera GestiCom-Portable
- **Réseau Local** : Tous les PC doivent être sur le même réseau (WiFi ou Ethernet)
- **Windows Firewall** : Autoriser le port 3000

---

## 🚀 Configuration Étape par Étape

### Étape 1 : Installer GestiCom-Portable sur le PC Serveur

1. Copier le dossier `GestiCom-Portable` sur le PC serveur
2. Ajouter `node.exe` dans le dossier `GestiCom-Portable`
3. Vérifier que `data/gesticom.db` existe

### Étape 2 : Trouver l'Adresse IP du Serveur

Sur le PC serveur, ouvrir PowerShell et exécuter :

```powershell
ipconfig
```

Noter l'**adresse IPv4** (exemple : `192.168.1.100`)

### Étape 3 : Configurer le Pare-feu Windows

Sur le PC serveur :

1. Ouvrir **Pare-feu Windows Defender**
2. Cliquer sur **Paramètres avancés**
3. **Règles entrantes** → **Nouvelle règle**
4. Sélectionner **Port** → **Suivant**
5. **TCP** → Port spécifique : **3000** → **Suivant**
6. **Autoriser la connexion** → **Suivant**
7. Cocher tous les profils → **Suivant**
8. Nom : **GestiCom Portable** → **Terminer**

**Ou via PowerShell (en tant qu'administrateur) :**
```powershell
New-NetFirewallRule -DisplayName "GestiCom Portable" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Étape 4 : Lancer GestiCom-Portable

Sur le PC serveur :

1. Double-cliquer sur `Lancer.bat` ou `Lancer.vbs`
2. Attendre que le serveur démarre (message dans la console)
3. Le serveur écoute maintenant sur **toutes les interfaces** (`0.0.0.0:3000`)

### Étape 5 : Accéder depuis les Autres PC

Sur chaque PC des points de vente :

1. Ouvrir un navigateur (Chrome, Edge, Firefox)
2. Aller à : `http://192.168.1.100:3000` (remplacer par l'IP du serveur)
3. Se connecter avec les identifiants :
   - **Login** : `admin`
   - **Mot de passe** : `Admin@123` (à changer après première connexion)

---

## 🔧 Configuration Avancée

### Changer le Port

Si le port 3000 est déjà utilisé, modifier `Lancer.bat` :

```batch
@echo off
cd /d "%~dp0"
set PORT=3001
if not exist "%~dp0node.exe" (
  echo Ajoutez node.exe dans ce dossier.
  pause
  exit /b 1
)
"%~dp0node.exe" "%~dp0portable-launcher.js"
```

### Vérifier que le Serveur Écoute sur le Réseau

Sur le PC serveur, vérifier avec PowerShell :

```powershell
netstat -an | findstr :3000
```

Vous devriez voir :
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
```

Si vous voyez `127.0.0.1:3000` au lieu de `0.0.0.0:3000`, le serveur n'écoute que sur localhost.

---

## ⚠️ Limitations SQLite en Multi-Utilisateurs

**Important** : SQLite n'est pas optimisé pour plusieurs utilisateurs simultanés :

- ✅ **2-3 utilisateurs** : Fonctionne généralement bien
- ⚠️ **4-5 utilisateurs** : Peut être lent, risques de verrous
- ❌ **6+ utilisateurs** : Non recommandé, risque de corruption

**Recommandations** :
- Limiter à **3 utilisateurs simultanés maximum**
- Éviter les opérations simultanées sur les mêmes produits
- Faire des sauvegardes régulières

---

## 🐛 Dépannage

### Problème : Impossible d'accéder depuis un autre PC

**Solutions** :

1. **Vérifier le pare-feu** :
   ```powershell
   Get-NetFirewallRule -DisplayName "GestiCom*"
   ```

2. **Vérifier que le serveur écoute** :
   ```powershell
   netstat -an | findstr :3000
   ```
   Doit afficher `0.0.0.0:3000` (pas `127.0.0.1:3000`)

3. **Vérifier la connectivité réseau** :
   Depuis un autre PC :
   ```powershell
   ping 192.168.1.100  # Remplacer par l'IP du serveur
   ```

4. **Vérifier que les PC sont sur le même réseau** :
   Les adresses IP doivent commencer par la même série (ex: `192.168.1.x`)

### Problème : Erreur "Base de données verrouillée"

**Cause** : Trop d'utilisateurs simultanés ou opérations concurrentes

**Solutions** :
- Réduire le nombre d'utilisateurs simultanés
- Attendre quelques secondes et réessayer
- Redémarrer le serveur si nécessaire

### Problème : Performance lente

**Solutions** :
- Réduire le nombre d'utilisateurs simultanés
- Fermer les autres applications sur le PC serveur
- Vérifier la connexion réseau (WiFi vs Ethernet)

---

## 📊 Test de Performance

Pour tester avec plusieurs utilisateurs :

1. Ouvrir plusieurs navigateurs (ou onglets en navigation privée)
2. Se connecter avec différents comptes utilisateurs
3. Effectuer des opérations simultanées
4. Surveiller les performances et les erreurs

---

## 🔐 Sécurité

### Recommandations

1. **Changer le mot de passe admin** après la première connexion
2. **Créer des comptes utilisateurs** pour chaque point de vente
3. **Limiter les permissions** selon les rôles
4. **Faire des sauvegardes régulières** de `data/gesticom.db`
5. **Ne pas exposer sur Internet** (réseau local uniquement)

### Accès depuis Internet (Non recommandé)

Si vous devez absolument accéder depuis Internet :

1. Configurer un **VPN** (recommandé)
2. Ou utiliser un **tunnel** (ngrok, Cloudflare Tunnel)
3. **Ne jamais** ouvrir directement le port 3000 sur Internet sans protection

---

## ✅ Checklist

- [ ] GestiCom-Portable installé sur le PC serveur
- [ ] `node.exe` ajouté dans le dossier
- [ ] Adresse IP du serveur notée
- [ ] Pare-feu Windows configuré (port 3000)
- [ ] Serveur lancé et accessible sur `http://IP:3000`
- [ ] Test d'accès depuis un autre PC réussi
- [ ] Mot de passe admin changé
- [ ] Comptes utilisateurs créés pour chaque point de vente
- [ ] Sauvegardes configurées

---

## 📝 Notes Importantes

- Le serveur doit **rester allumé** pour que les autres PC puissent accéder
- Si le PC serveur redémarre, relancer `Lancer.bat`
- Les données sont stockées dans `data/gesticom.db` sur le PC serveur
- Pour un usage intensif multi-utilisateurs, considérer la migration vers Vercel + PostgreSQL

---

**Pour plus d'informations, consultez : `docs/DEPLOIEMENT_VERCEL_ET_RESEAU.md`**
