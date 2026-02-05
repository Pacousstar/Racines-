# Base de données portable, build et récupération

Ce document explique comment ne pas perdre vos enregistrements, récupérer des données perdues, transférer ou fusionner une base entre PC, et comment gérer la BD avant/après chaque `npm run build:portable`.

## 0. Stabilité de la base au lancement du portable

Lorsque vous lancez **Lancer.bat** (ou Lancer.vbs) :

1. **Sans espaces dans le chemin** : la base **data/gesticom.db** est utilisée directement.
2. **Avec espaces dans le chemin** (ex. clé USB « GSN EXPERTISES », dossier « Mon Dossier ») : le launcher utilise **C:\gesticom_portable_data\gesticom.db** pour éviter les erreurs SQLite.  
   - **Premier lancement** (C:\ n’existe pas) : **data/gesticom.db** est copié vers C:\, puis l’app lit/écrit dans C:\.  
   - **Lancements suivants** : le launcher **n’écrase plus** C:\ avec data/. Il utilise directement C:\ (où sont vos enregistrements). Ainsi, après avoir fermé Lancer.bat et rallumé le PC, tous les enregistrements passés sont conservés.  
   - **À l’arrêt** : C:\ est recopié vers **data/gesticom.db** pour que la clé USB (ou le dossier) contienne la dernière base.  
   **Important** : fermez toujours le portable en fermant la fenêtre Lancer.bat (pas en tuant le processus), pour que la recopie C:\ → data/ s’effectue.
3. **ensure-schema.js** s’exécute automatiquement avant le serveur : colonnes/tables manquantes ajoutées sans perte de données.
4. Une seule instance du serveur et **un seul onglet** navigateur.
5. Une seule instance à la fois : si GestiCom est déjà lancé, un message vous le signale.

---

## 1. Récupérer des enregistrements perdus après un build:portable

### À faire en premier (si le portable tournait avec un chemin contenant des espaces)

Quand le portable est lancé depuis un chemin avec espaces (ex. `C:\Users\Mon Nom\...`), le launcher copie la base vers **C:\gesticom_portable_data\gesticom.db**. Ce fichier **n’est pas supprimé** par `build:portable` (seul le dossier GestiCom-Portable est supprimé).

- Ouvrir l’Explorateur et aller dans **C:\gesticom_portable_data**.
- Si **gesticom.db** est présent, c’est très probablement votre base avec vos enregistrements.
- **Copier** ce fichier vers **GestiCom-Portable\data\gesticom.db** (remplacer le fichier existant).
- Relancer le portable (Lancer.bat) : vos données devraient réapparaître.

### Sauvegardes automatiques (à partir du prochain build)

À partir de maintenant, **avant** de supprimer GestiCom-Portable, le script de build :

- sauvegarde **GestiCom-Portable\data\gesticom.db** dans le projet sous le nom **backup-portable-data-YYYYMMDDHHmm.db** ;
- sauvegarde aussi **C:\gesticom_portable_data\gesticom.db** (sous **backup-portable-C-drive-YYYYMMDDHHmm.db**) s’il existe.

Ces fichiers sont créés **à la racine du projet GestiCom** (à côté de `package.json`).  
**Nettoyage automatique** : à chaque `build:portable`, seules les **2 sauvegardes les plus récentes** de chaque type sont conservées ; les anciennes sont supprimées pour limiter l’espace disque. Pour libérer de la place sans refaire un build : `npm run portable:clean-backups`.

Pour restaurer :

1. Copier le fichier de sauvegarde voulu (ex. `backup-portable-data-202601291430.db`) vers **GestiCom-Portable\data\gesticom.db** (écraser le fichier existant).
2. Si le schéma a évolué (nouvelle table, ex. Depense), exécuter dans le projet :  
   `npm run portable:fix-depense` puis `npm run portable:copy-db`  
   **ou** laisser le launcher recopier la base au démarrage (si vous avez restauré dans `data/`, c’est cette base qui sera utilisée après redémarrage du portable).

### Autres pistes si rien ci-dessus n’existe

- **Corbeille** : vérifier si le dossier **GestiCom-Portable** (ou le fichier **data\gesticom.db**) a été envoyé à la corbeille lors de la suppression.
- **Historique des fichiers Windows** : si activé, une version précédente de **gesticom.db** peut être restaurable (clic droit sur le dossier/data → Propriétés → Versions précédentes).
- **Sauvegardes** : tout emplacement où vous ou un logiciel auriez copié le dossier portable ou la base.

---

## 2. Comportement avec la BD avant et après chaque build:portable

### Ce que fait `npm run build:portable`

1. Lance `npm run build` et `npx prisma db push` (met à jour **prisma/gesticom.db**).
2. **Sauvegarde** automatique de la base du portable (voir ci-dessus) si elle existe.
3. **Supprime** tout le dossier **GestiCom-Portable**.
4. Recrée le dossier et y copie l’app (standalone, static, etc.) et **prisma/gesticom.db** → **GestiCom-Portable\data\gesticom.db**.

Donc : après un build, **data/gesticom.db** dans le portable est **toujours** une copie de **prisma/gesticom.db** (souvent vide ou avec des données de dev), et vos anciennes données du portable ne sont plus dans ce dossier — d’où l’importance des sauvegardes automatiques et de C:\gesticom_portable_data.

### Bonnes pratiques

| Situation | Action recommandée |
|-----------|--------------------|
| **Avant** chaque `npm run build:portable` | Rien de plus : le script sauvegarde maintenant automatiquement la base du portable (et C:\gesticom_portable_data) dans le projet. |
| **Après** le build | Si vous voulez **garder les enregistrements du portable** : copier le fichier **backup-portable-data-*.db** (ou **backup-portable-C-drive-*.db**) vers **GestiCom-Portable\data\gesticom.db**. Puis relancer le portable. |
| Utilisation **quotidienne** du portable | Les données sont écrites dans **data/gesticom.db** (ou C:\gesticom_portable_data). Aucune action spéciale. |
| Vous voulez que le portable reparte de la base du projet | Ne rien restaurer : après le build, **data/gesticom.db** est déjà une copie de **prisma/gesticom.db**. |

En résumé : après un build, **soit** vous restaurez une sauvegarde pour retrouver les données du portable, **soit** vous gardez la nouvelle base (celle du projet).

---

## 3. Transférer une BD d’un PC à un autre

### Remplacer complètement la base sur l’autre PC

1. Sur le **PC source** (celui qui a les données) : copier le fichier **data\gesticom.db** du portable (ou **C:\gesticom_portable_data\gesticom.db** si vous utilisiez ce chemin).
2. Transférer ce fichier vers l’autre PC (clé USB, partage, cloud, etc.).
3. Sur le **PC cible** : remplacer **GestiCom-Portable\data\gesticom.db** par ce fichier (ou le mettre dans **data\** et renommer en **gesticom.db**).
4. Relancer le portable sur le PC cible : il utilisera cette base.

Aucune fusion : la base du PC cible est entièrement remplacée par celle du PC source.

### Fusionner les données de deux bases (deux PC)

Fusionner deux bases (ex. ventes du PC A + ventes du PC B) dans une seule est plus délicat (références, numéros, doublons). Deux approches possibles :

- **Manuelle** : exporter les données importantes (ex. ventes, achats, dépenses) depuis une base (CSV, Excel, ou copier des enregistrements), puis les ressaisir ou les importer dans l’autre base.
- **Script de fusion** : un script peut être ajouté au projet pour fusionner une base « source » dans une base « cible » (par table, avec gestion des conflits). Si vous en avez besoin, on peut le préciser (quelles tables fusionner, quelles règles).

Pour l’instant, la procédure sûre recommandée est : **choisir une base de référence** (par ex. celle du PC qui a le plus de données à jour) et **remplacer** l’autre avec cette base (procédure « Transférer une BD » ci-dessus), plutôt que de fusionner sans outil.

---

## 4. Résumé

- **Récupération** : vérifier **C:\gesticom_portable_data\gesticom.db** et les **backup-portable-*.db** à la racine du projet ; restaurer en copiant vers **GestiCom-Portable\data\gesticom.db**.
- **Avant/après build** : le build sauvegarde désormais la base du portable ; après le build, restaurer un backup si vous voulez retrouver les enregistrements du portable.
- **Transfert PC → PC** : copier **data\gesticom.db** (ou celle de C:\gesticom_portable_data) du PC source vers **GestiCom-Portable\data\gesticom.db** sur le PC cible.
- **Fusion** : privilégier une base de référence et remplacer l’autre ; une fusion automatique peut être ajoutée plus tard si besoin.
