# Où retrouver la vraie base du 04/02/2026

L’application utilise **une seule** base de données : **`prisma/gesticom.db`** (définie dans `.env` par `DATABASE_URL`). Si vous aviez une base qui fonctionnait bien au 04/02/2026, il faut **remettre cette base** à cet emplacement.

---

## 1. Fichiers de la base du 04/02/2026

Ce sont des **sauvegardes** créées le 4 février 2026 (build portable ou copie manuelle). Les noms possibles :

| Fichier | Emplacement attendu | Description |
|--------|---------------------|-------------|
| **backup-portable-data-202602040524.db** | **Racine du projet** (`GestiCom-master/`) | Sauvegarde du 04/02/2026 à 05h24 |
| **backup-portable-data-202602040517.db** | **Racine du projet** (`GestiCom-master/`) | Sauvegarde du 04/02/2026 à 05h17 |
| **gesticom_production.db** | **docs/** (`GestiCom-master/docs/`) | Copie « production » (peut être du 04/02 ou proche) |

La **vraie** base que l’app utilise est toujours : **`GestiCom-master/prisma/gesticom.db`**.  
Les fichiers ci‑dessus ne servent qu’à **restaurer** cette base.

---

## 2. Où les retrouver sur votre PC

- **Racine du projet**  
  `C:\Users\EMERAUDE\Projets\GestiCom-master\`  
  Vérifiez si vous y avez :  
  `backup-portable-data-202602040524.db` ou `backup-portable-data-202602040517.db`.

- **Dossier docs**  
  `C:\Users\EMERAUDE\Projets\GestiCom-master\docs\`  
  Fichier possible : **gesticom_production.db**.

- **Sauvegardes du script**  
  Quand vous lancez la restauration, l’ancienne base est copiée à la racine sous un nom du type :  
  `gesticom-backup-avant-restauration-XXXXXXXXXX.db`  
  Si vous avez fait une restauration un 04/02, l’un de ces fichiers peut être votre « vraie » base du 04/02.

- **Recherche Windows**  
  Dans l’Explorateur :  
  - Aller dans `C:\Users\EMERAUDE\Projets\GestiCom-master` (ou un dossier parent).  
  - Barre de recherche : `*20260204*.db` ou `*gesticom*.db`.  
  Cela liste les bases avec la date 04/02/2026 dans le nom ou « gesticom ».

- **Build portable**  
  Si vous aviez un build portable du 04/02 :  
  - `GestiCom-Portable\data\gesticom.db`  
  - ou `C:\gesticom_portable_data\gesticom.db`  
  Copiez ce fichier sur le PC de dev et utilisez‑le comme source de restauration (voir ci‑dessous).

---

## 3. Restaurer la base du 04/02/2026

Une fois que vous avez **un** fichier `.db` qui est bien la base du 04/02/2026 :

1. **Arrêter** l’app (serveur Next.js / portable).
2. **Lancer la restauration** depuis la racine du projet :

   - Si le fichier est à un emplacement déjà reconnu par le script (racine ou `docs/`) :  
     ```bash
     node scripts/restaurer-bd.js
     ```
   - Sinon, en donnant le **chemin** vers votre fichier :  
     ```bash
     node scripts/restaurer-bd.js "chemin/vers/votre-fichier.db"
     ```  
     Exemple :  
     ```bash
     node scripts/restaurer-bd.js "C:\Users\EMERAUDE\Projets\GestiCom-master\backup-portable-data-202602040524.db"
     ```
     ou si vous l’avez mis dans `docs` :  
     ```bash
     node scripts/restaurer-bd.js docs/gesticom_production.db
     ```

3. Le script :
   - sauvegarde l’actuelle `prisma/gesticom.db` (au cas où),
   - remplace `prisma/gesticom.db` par la base du 04/02/2026.

4. **Réinitialiser le mot de passe admin** (la base restaurée peut avoir un autre mot de passe) :  
   ```bash
   npm run db:reset-admin
   ```

5. **Relancer l’app** avec :  
   ```bash
   npm run dev:legacy
   ```  
   Puis connexion : **admin** / **Admin@123**.

---

## 4. Résumé : quelle base est utilisée ?

- **En développement** : la base utilisée est **toujours**  
  `GestiCom-master/prisma/gesticom.db`  
  (et `DATABASE_URL` dans `.env` pointe dessus).

- La « vraie » base du 04/02/2026, c’est **un** de ces fichiers de sauvegarde (backup-… ou gesticom_production.db). Pour que ce soit elle qui soit utilisée, il faut **restaurer** ce fichier vers `prisma/gesticom.db` avec `node scripts/restaurer-bd.js` comme ci‑dessus.

- Après restauration, `prisma/gesticom.db` **est** la vraie base du 04/02/2026 (ou la copie que vous avez choisie).
