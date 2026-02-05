# Procédure : Mise à jour production (ancienne version → nouvelle version)

Cette procédure s’applique quand vous installez la **nouvelle version** de GestiCom sur un PC déjà **en production** avec une **ancienne version**, et que :
- l’ancienne base contient environ **550 produits** et des **opérations / enregistrements** (ventes, achats, etc.) ;
- la nouvelle version est livrée avec un import Excel qui crée environ **3 289 produits**.

---

## 1. Comprendre la situation

| Élément | Ancienne base (PC production) | Nouvelle version (fichier Excel) |
|--------|------------------------------|-----------------------------------|
| Produits | ~550 | 3 289 (via import Excel) |
| Ventes, achats, stocks, clients… | Conservés | À préserver ou à repartir de zéro |

**Important** : Les ~550 produits de la base production sont **également présents** dans le fichier Excel (3 289 produits). Le fichier Excel contient donc :
- Les produits existants en production (~550) avec leurs stocks initiaux
- De nouveaux produits supplémentaires (~2 739) avec leurs stocks initiaux

**Problématique** : Si vous importez l’Excel tel quel, les stocks réels de production (modifiés par les ventes/achats) risquent d’être écrasés par les stocks initiaux de l’Excel.

**Solution** : Le script d’import (`npm run db:importer`) a été modifié pour **préserver automatiquement les stocks existants**. Lors de l’import :
- ✅ Les produits existants sont **mis à jour** (prix, catégorie, désignation) mais leurs **stocks sont préservés**
- ✅ Seuls les nouveaux produits (non présents en production) auront leurs stocks créés depuis l’Excel
- ✅ Les nouveaux produits créés manuellement en production sont conservés

Deux stratégies possibles :

- **Option A – Garder l’historique du PC** (recommandée)  
  Vous gardez la base actuelle du PC. Vous mettez à jour uniquement l’application (code). Vous pouvez ensuite **ajouter** les nouveaux produits via l’import Excel. Les stocks existants seront préservés automatiquement.

- **Option B – Repartir avec le nouveau catalogue uniquement**  
  Vous remplacez la base par une nouvelle, vous importez l’Excel (3 289 produits). Vous **perdez** l’historique des ventes/achats/opérations de l’ancienne base (sauf si vous faites une migration avancée, non décrite ici).

La suite décrit **Option A** (recommandée pour ne pas perdre les enregistrements).

---

## 2. Avant la mise à jour (sur le PC en production)

1. **Fermer l’application** (ancienne version) pour éviter tout accès à la base pendant la manipulation.
2. **Sauvegarder la base de données**  
   - Copier le fichier de base (souvent `prisma/gesticom.db` ou le chemin indiqué dans `DATABASE_URL`) vers un dossier de sauvegarde, par exemple :  
     `Backup_gesticom_YYYYMMDD.db`
3. **Noter** le chemin exact du fichier `.db` utilisé en production (celui dans `.env` ou `.database_url`).

---

## 3. Installer la nouvelle version de l’application

1. **Remplacer les fichiers de l’application** par ceux de la nouvelle version (sauf la base de données et, si vous les personnalisez, `.env` / `.database_url`).
2. **Ne pas écraser** le fichier de base de données existant (par ex. `prisma/gesticom.db`) : garder celui du PC production.
3. **Conserver** le fichier `.env` (ou `.database_url`) du PC pour que `DATABASE_URL` pointe toujours vers la **même** base que celle utilisée actuellement.
4. **Installer les dépendances** (si besoin) :  
   `npm install`  
5. **Appliquer le schéma Prisma** (migrations / colonnes éventuelles) :  
   `npx prisma generate`  
   `npx prisma db push`  
   (Cela met à jour les tables sans effacer les données existantes, dans la limite des migrations prévues.)
6. **Lancer l’application** :  
   `npm run build` puis `npm run start`  
   (ou selon votre mode de démarrage habituel.)

À ce stade, vous avez la **nouvelle version** qui tourne sur l’**ancienne base** : ~550 produits + tout l’historique (ventes, achats, etc.).

---

## 4. (Optionnel) Ajouter le nouveau catalogue (3 289 produits)

Si vous voulez **ajouter** les produits de l’Excel sans perdre les enregistrements de production :

1. Placer le fichier **GestiCom BD FINALE.xlsx** dans `docs/` (comme prévu par le script).
2. Lancer l’import :  
   `npm run db:importer`  
3. **Comportement de l’import** :
   - ✅ Les produits existants (~550) sont **mis à jour** (prix, catégorie, désignation) mais leurs **stocks réels sont préservés** (non écrasés)
   - ✅ Les nouveaux produits (~2 739) sont **créés** avec leurs stocks initiaux depuis l’Excel
   - ✅ Les nouveaux produits créés manuellement en production sont conservés
   - ✅ Les ventes/achats déjà enregistrés restent intacts et liés aux produits existants
4. Après l’import, vous aurez : **~550 produits mis à jour + ~2 739 nouveaux produits = ~3 289 produits au total**.

**Note** : Si vous souhaitez forcer l’écrasement des stocks existants (non recommandé en production), vous pouvez définir la variable d’environnement avant l’import :
```bash
set PRESERVE_STOCKS=false
npm run db:importer
```
Par défaut, `PRESERVE_STOCKS=true` (stocks préservés).

Si vous **ne lancez pas** l’import, vous restez avec les ~550 produits et tout l’historique inchangé.

---

## 5. Vérifications après MAJ

1. Se connecter avec un utilisateur existant (ex. admin).
2. Vérifier le **tableau de bord** (nombre de produits, stocks, ventes).
3. Vérifier une **vente**, un **achat**, la **liste des produits** et, si vous avez fait l’import, la présence des nouveaux produits.

---

## 6. Build de la version portable

À faire **depuis le projet à jour** (après MAJ et tests) :

1. À la racine du projet :  
   `npm run build:portable`
2. Le script crée (ou met à jour) le dossier **GestiCom-Portable** avec l’app compilée, la base (copie ou celle par défaut), et les fichiers nécessaires.
3. **Ajouter** `node.exe` dans ce dossier si besoin (selon la doc portable du projet).
4. Tester le lancement (ex. `Lancer.bat` ou script prévu).

**En cas d’erreur EPERM sous Windows** (ex. lors de `prisma generate`) : fermer Cursor/VS Code et tout processus Node, puis relancer `npm run build:portable` depuis un terminal dédié.

La version portable peut utiliser une **copie** de la base ; les enregistrements faits dans la portable sont dans **sa** base (souvent dans `data/gesticom.db`), pas automatiquement dans celle du PC installé.

---

## 7. Commit final sur GitHub

Depuis la racine du dépôt GestiCom :

```bash
git status
git add .
git commit -m "Release production: MAJ app, persistance vérifiée, procédure MAJ et portable"
git push origin main
```

(Remplacez `main` par le nom de votre branche si différent.)

---

## Résumé

- **Connexion / déconnexion** : ne suppriment pas les données (voir `docs/PERSISTANCE_DONNEES.md`).
- **MAJ production** : sauvegarder la base → remplacer l’app → garder la même base et le même `DATABASE_URL` → `prisma generate` + `db push` → redémarrer.
- **Import Excel** : `npm run db:importer` (Excel dans `docs/`) **préserve automatiquement les stocks existants** pour ne pas perdre les enregistrements de production.
- **Stocks** : Les stocks réels (modifiés par les opérations) sont préservés lors de l’import. Seuls les stocks manquants sont créés depuis l’Excel.
- **Portable** : `npm run build:portable` après MAJ.
- **GitHub** : `git add .` → `git commit` → `git push`.
