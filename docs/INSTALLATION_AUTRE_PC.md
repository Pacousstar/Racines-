# Procédure d’installation de GestiCom sur un autre PC

Cette procédure permet d’installer et d’utiliser GestiCom sur un PC qui **n’a pas** l’environnement de développement (pas de Node.js installé globalement, pas de projet cloné). On utilise la **version portable** de GestiCom.

---

## 1. Sur le PC où GestiCom est développé (une seule fois)

1. Ouvrir un terminal dans le **dossier du projet GestiCom** (celui qui contient `package.json`).
2. Lancer la construction du portable :
   ```bash
   npm run build:portable
   ```
3. Une fois le build terminé, le dossier **GestiCom-Portable** est créé à la racine du projet.
4. Télécharger **Node.js** (version LTS, binaires Windows **sans installateur**) :
   - Aller sur : https://nodejs.org/dist/
   - Choisir la dernière version LTS (ex. `v20.18.0`), puis télécharger le fichier **`.zip`** pour Windows 64 bits (ex. `node-v20.18.0-win-x64.zip`).
5. Ouvrir l’archive et **extraire uniquement le fichier `node.exe`** dans le dossier **GestiCom-Portable** (à côté de `Lancer.bat`, `server.js`, etc.).

Vous obtenez un dossier **GestiCom-Portable** complet, prêt à être copié.

---

## 2. Transférer GestiCom sur l’autre PC

- **Option A** : Copier tout le dossier **GestiCom-Portable** sur une **clé USB**, puis copier ce dossier depuis la clé vers l’autre PC (par ex. `C:\GestiCom-Portable` ou `D:\GestiCom-Portable`).
- **Option B** : Copier **GestiCom-Portable** via un partage réseau, un cloud (OneDrive, etc.) ou tout autre moyen de transfert.

Important : le dossier doit contenir au minimum :
- `node.exe`
- `server.js`
- le dossier `.next` (avec `server` et `static`)
- le dossier `data` (avec `gesticom.db`)
- `portable-launcher.js`
- `Lancer.bat` et `Lancer.vbs`
- le dossier `public` (si présent)

---

## 3. Sur l’autre PC (premier lancement)

1. Placer le dossier **GestiCom-Portable** où vous voulez (ex. `C:\GestiCom-Portable` ou bureau).  
   Conseil : éviter un chemin avec **espaces** (ex. `C:\Program Files\...`) pour limiter les soucis avec SQLite.
2. Vérifier que **node.exe** est bien présent dans ce dossier.
3. Vérifier que le dossier **data** existe et contient **gesticom.db**.
4. **Lancer GestiCom** :
   - **Sans fenêtre de commande** : double-clic sur **Lancer.vbs**
   - **Avec fenêtre** (pour voir les messages) : double-clic sur **Lancer.bat**
5. Le navigateur doit s’ouvrir sur **http://localhost:3000**. Sinon, ouvrir manuellement cette adresse.
6. **Première connexion** :
   - Identifiant : **admin**
   - Mot de passe : **Admin@123**  
   (à modifier après première connexion, via Paramètres ou la base.)

---

## 4. Utilisation au quotidien

- **Démarrer** : double-clic sur **Lancer.vbs** ou **Lancer.bat**.
- **Arrêter** : fermer la fenêtre **Lancer.bat** si elle est ouverte, ou arrêter le processus **Node.js** dans le Gestionnaire des tâches (Ctrl+Maj+Échap).
- **Données** : tout est enregistré dans **data/gesticom.db** (et éventuellement recopié vers `C:\gesticom_portable_data` si le chemin du dossier contient des espaces ; les données sont resynchronisées à l’arrêt).

---

## 5. Cas particulier : chemin avec espaces

Si GestiCom-Portable est dans un chemin contenant des espaces (ex. `C:\Users\Mon Nom\Bureau\GestiCom-Portable`) :

- Au démarrage, le launcher copie la base vers **C:\gesticom_portable_data** et l’utilise pendant la session.
- À l’arrêt (fermeture de Lancer.bat), les données sont recopiées vers **data/gesticom.db**.
- Pour éviter tout problème, on peut placer le dossier dans un chemin **sans espaces** (ex. `C:\GestiCom-Portable` ou `D:\GestiCom-Portable`).

---

## 6. Dépannage rapide

| Problème | Action |
|----------|--------|
| « node.exe manquant » | Remettre **node.exe** dans GestiCom-Portable (voir étape 1). |
| « data\gesticom.db manquant » | Refaire un **build:portable** sur le PC de dev et recopier tout le dossier (ou au moins **data/gesticom.db**). |
| « Erreur serveur » / table manquante | Sur le PC de dev : `npm run portable:copy-db`, puis recopier **data/gesticom.db** dans GestiCom-Portable sur l’autre PC, puis relancer. |
| Le navigateur ne s’ouvre pas | Ouvrir manuellement **http://localhost:3000**. |
| Port 3000 déjà utilisé | Fermer l’autre application qui utilise le port 3000, ou le launcher tentera un autre port (ex. 3001) ; dans ce cas ouvrir **http://localhost:3001**. |

---

## 7. Mise à jour de GestiCom sur l’autre PC

Quand une nouvelle version est prête :

1. Sur le **PC de développement** : lancer à nouveau **npm run build:portable**.
2. Recopier le dossier **GestiCom-Portable** (ou au minimum son contenu) vers l’autre PC, en **remplaçant** l’ancien (sauvegarder **data/gesticom.db** si vous voulez conserver les données de ce PC, puis la remettre dans le nouveau dossier **data/**).
3. Remettre **node.exe** dans le dossier si celui-ci a été recréé.
4. Relancer **Lancer.bat** ou **Lancer.vbs** sur l’autre PC.

---

## Résumé en 3 étapes (sur l’autre PC)

1. Copier le dossier **GestiCom-Portable** (avec **node.exe** et **data/gesticom.db**) sur le PC.
2. Double-cliquer sur **Lancer.vbs** (ou **Lancer.bat**).
3. Se connecter avec **admin** / **Admin@123** et changer le mot de passe si besoin.
