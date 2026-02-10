# Performance et build portable

## Pourquoi GestiCom peut être lent

1. **Base SQLite partagée**  
   Si le **portable** (Lancer.bat) est ouvert en même temps que vous lancez **npm run dev** sur le même PC, les deux peuvent utiliser la même base (ou une copie dans `%LOCALAPPDATA%\GestiComPortable` si le chemin du portable contient des espaces). SQLite gère mal deux processus qui écrivent en même temps → blocages et lenteur.  
   **À faire :** fermer le portable (Lancer.bat) quand vous travaillez en dev sur le projet, et inversement.

2. **Mode développement (npm run dev)**  
   Next.js en mode dev recompile à la demande et est plus lent que la version compilée.  
   **À faire :** pour tester en “rapide”, faire un build puis lancer en production :
   ```bash
   npm run build
   npm run start
   ```
   Puis ouvrir http://localhost:3000 (sans avoir le portable ouvert sur la même base).

3. **Volume de données**  
   Beaucoup de ventes/achats/mouvements sur une longue période peut ralentir le dashboard (graphiques). Des limites ont été mises dans l’API des stats pour éviter de charger des dizaines de milliers de lignes.

4. **Premier chargement**  
   La première ouverture après démarrage du serveur peut être plus lente (compilation, connexion base). Les suivantes sont en général plus rapides.

## Lancer le build portable

Vous pouvez lancer le build portable dès que le projet est à jour et que vous voulez un dossier prêt à copier (clé USB, autre PC).

1. **Fermer** toute instance qui utilise la base :
   - Fermer la fenêtre **Lancer.bat** du portable si elle est ouverte.
   - Arrêter **npm run dev** (ou **npm run start**) si vous l’aviez lancé.

2. **À la racine du projet** (dossier contenant `package.json`) :
   ```bash
   npm run build:portable
   ```

3. Le script va :
   - lancer `npm run build` (Prisma + Next.js),
   - créer le dossier **GestiCom-Portable** avec l’app, la base copiée (celle de `C:\gesticom\gesticom.db` si elle existe, sinon `prisma/gesticom.db`), les guides et le launcher.

4. **Ensuite** (pour utiliser le portable) :
   - Copier **GestiCom-Portable** sur la clé ou l’autre PC.
   - Ajouter **node.exe** dans le dossier (zip depuis nodejs.org, puis extraire `node.exe`).
   - Lancer **Lancer.bat** ou **Lancer.vbs**.
   - Consulter **GUIDE_INSTALLATION_PORTABLE.md** dans le dossier pour les détails.

Vous pouvez donc lancer `npm run build:portable` quand vous voulez, après avoir fermé le portable et/ou le serveur dev pour éviter les conflits sur la base.
