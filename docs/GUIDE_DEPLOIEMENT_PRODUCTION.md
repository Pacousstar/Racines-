# Guide de Déploiement en Production - GestiCom

**Date :** Février 2026  
**Version :** 0.1.0

---

## 📋 Prérequis

### 1. Serveur
- **OS** : Windows Server 2016+ ou Linux (Ubuntu 20.04+)
- **RAM** : Minimum 2 Go (recommandé 4 Go)
- **Disque** : Minimum 10 Go d'espace libre
- **Réseau** : Accès Internet pour installation des dépendances

### 2. Logiciels requis
- **Node.js** : Version 18.x ou 20.x LTS
- **npm** : Version 9.x ou supérieure
- **Git** : Pour cloner le dépôt (optionnel)

---

## 🚀 Installation

### Option A : Déploiement Standard (Serveur dédié)

#### 1. Préparer l'environnement

```bash
# Sur Linux (Ubuntu/Debian)
sudo apt update
sudo apt install -y nodejs npm git

# Vérifier les versions
node --version  # Doit être 18.x ou 20.x
npm --version   # Doit être 9.x+
```

#### 2. Cloner ou copier le projet

```bash
# Option 1 : Cloner depuis Git
git clone <url-du-repo> gesticom
cd gesticom

# Option 2 : Copier depuis un autre emplacement
# Copier le dossier GestiCom-master vers /opt/gesticom (ou autre)
```

#### 3. Installer les dépendances

```bash
cd gesticom
npm install
```

#### 4. Configurer la base de données

```bash
# Initialiser Prisma
npx prisma generate

# Créer la base de données
npx prisma db push

# Charger les données initiales
npm run db:seed
```

#### 5. Configurer les variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Base de données
DATABASE_URL="file:./prisma/gesticom.db"

# JWT Secret (générer une clé aléatoire)
JWT_SECRET="votre-cle-secrete-tres-longue-et-aleatoire"

# Environnement
NODE_ENV="production"
```

**⚠️ Important** : Générer un `JWT_SECRET` sécurisé :
```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 6. Construire l'application

```bash
npm run build
```

#### 7. Démarrer le serveur

```bash
# Mode production
npm start

# Ou avec PM2 (recommandé pour production)
npm install -g pm2
pm2 start npm --name "gesticom" -- start
pm2 save
pm2 startup  # Pour démarrer automatiquement au boot
```

---

### Option B : Déploiement Portable (Clé USB / Disque local)

Voir le guide : `docs/GUIDE_INSTALLATION_PORTABLE.md`

---

## 🔧 Configuration du Serveur Web (Optionnel)

### Avec Nginx (Reverse Proxy)

#### 1. Installer Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 2. Configurer Nginx

Créer `/etc/nginx/sites-available/gesticom` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;  # Remplacer par votre domaine ou IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. Activer la configuration

```bash
sudo ln -s /etc/nginx/sites-available/gesticom /etc/nginx/sites-enabled/
sudo nginx -t  # Vérifier la configuration
sudo systemctl reload nginx
```

#### 4. Configurer HTTPS (Recommandé)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com
```

---

## 🔐 Sécurité

### 1. Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. Permissions des fichiers

```bash
# S'assurer que la base de données n'est pas accessible publiquement
chmod 600 prisma/gesticom.db
chmod 700 prisma/
```

### 3. Mettre à jour le mot de passe admin

**⚠️ CRITIQUE** : Changer le mot de passe par défaut après la première connexion :
- Identifiant : `admin`
- Mot de passe par défaut : `Admin@123`

---

## 📊 Monitoring et Maintenance

### 1. Logs

```bash
# Logs PM2
pm2 logs gesticom

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Sauvegardes

#### Automatiser les sauvegardes

Créer un script `/opt/gesticom/scripts/backup.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/opt/gesticom-backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp prisma/gesticom.db "$BACKUP_DIR/gesticom_$DATE.db"
# Garder seulement les 30 derniers backups
ls -t $BACKUP_DIR/gesticom_*.db | tail -n +31 | xargs rm -f
```

Ajouter au crontab :

```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/gesticom/scripts/backup.sh
```

### 3. Mises à jour

```bash
# Arrêter l'application
pm2 stop gesticom

# Mettre à jour le code
git pull  # ou copier les nouveaux fichiers

# Mettre à jour les dépendances
npm install

# Mettre à jour la base de données si nécessaire
npx prisma db push

# Reconstruire
npm run build

# Redémarrer
pm2 restart gesticom
```

---

## 🐛 Dépannage

### L'application ne démarre pas

1. Vérifier les logs :
   ```bash
   pm2 logs gesticom
   ```

2. Vérifier que le port 3000 est libre :
   ```bash
   netstat -tulpn | grep 3000
   ```

3. Vérifier les permissions de la base de données :
   ```bash
   ls -la prisma/gesticom.db
   ```

### Erreur de base de données

1. Vérifier que Prisma est à jour :
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. Vérifier la connexion :
   ```bash
   npx prisma studio  # Interface graphique
   ```

### Performance lente

1. Vérifier l'utilisation des ressources :
   ```bash
   pm2 monit
   ```

2. Augmenter la mémoire Node.js :
   ```bash
   pm2 restart gesticom --max-memory-restart 1G
   ```

---

## 📱 Mode PWA (Progressive Web App)

GestiCom est configuré comme PWA. Les utilisateurs peuvent :

1. **Installer l'application** sur mobile/tablette :
   - Ouvrir GestiCom dans le navigateur
   - Suivre les instructions d'installation
   - L'application apparaîtra comme une app native

2. **Utilisation hors-ligne** :
   - Les pages visitées sont mises en cache
   - Fonctionnalités de base disponibles sans Internet
   - Synchronisation automatique au retour en ligne

---

## ✅ Checklist de Déploiement

- [ ] Serveur préparé (Node.js, npm installés)
- [ ] Projet cloné/copié
- [ ] Dépendances installées (`npm install`)
- [ ] Base de données initialisée (`npx prisma db push`)
- [ ] Données initiales chargées (`npm run db:seed`)
- [ ] Fichier `.env` configuré avec `JWT_SECRET`
- [ ] Application construite (`npm run build`)
- [ ] Serveur démarré (`npm start` ou PM2)
- [ ] Nginx configuré (si reverse proxy)
- [ ] HTTPS configuré (si domaine)
- [ ] Firewall configuré
- [ ] Mot de passe admin changé
- [ ] Sauvegardes automatisées configurées
- [ ] Monitoring configuré (PM2)

---

## 📞 Support

Pour toute question ou problème :
1. Consulter les logs (`pm2 logs gesticom`)
2. Vérifier la documentation technique
3. Contacter le support technique avec :
   - Version de Node.js (`node --version`)
   - Logs d'erreur
   - Description du problème

---

**Bon déploiement !** 🚀
