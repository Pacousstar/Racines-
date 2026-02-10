# Contexte pour Cursor sur le PC de production

À ouvrir ou à @ mentionner dans Cursor après avoir cloné le dépôt sur le PC de prod, pour que l’assistant ait le contexte et les règles du projet.

---

## Règles et standards du projet (à respecter)

- **Langue** : tout le travail (code, docs, réponses) en **français**.
- **Référence** : `AGENTS.md` à la racine (MonAP, autonomie, sécurité, conventions).
- **Sécurité** : pas de secrets dans le code ; `.env` et `.gitignore` correctement configurés ; validation des entrées, pas d’`eval`.
- **Stack** : Next.js, Prisma, SQLite. Base : `DATABASE_URL` dans `.env` (ex. `file:C:/gesticom/gesticom.db` ou `file:./prisma/gesticom.db`).

---

## Problème à résoudre en priorité (portable sur PC de prod)

Sur le **PC de production**, quand on lance le **portable** (GestiCom-Portable, Lancer.bat) :

- **Symptôme** : les enregistrements (ventes, achats, stock, clients, fournisseurs, caisse, dépenses, charges) **ne se sauvegardent pas** ou n’apparaissent pas après rechargement.
- **Contexte** :
  - Sur le PC de **dev**, le portable enregistre correctement.
  - Sur le PC de **prod**, le portable est copié (ex. dans `C:\GestiCom-Portable`, chemin **sans espaces**) mais les écritures ne persistent pas.
- **Pistes déjà travaillées** (voir historique des commits / conversations) :
  - Utiliser un chemin **sans espaces** pour le portable (ex. `C:\GestiCom-Portable`) pour utiliser `data/gesticom.db` comme en dev.
  - Ne pas écraser `process.env.DATABASE_URL` dans `lib/db.ts` si elle est déjà définie par le launcher.
  - Dans `run-standalone.js` (généré par le launcher), lire **d’abord** `.database_url` du dossier portable, puis éventuellement `%LOCALAPPDATA%\GestiComPortable\database_url.txt`.
  - S’assurer que le **serveur** (Next.js) utilise bien la **même** base que le launcher (même `DATABASE_URL`).
- **À faire sur le PC de prod** :
  1. Cloner le dépôt GitHub, ouvrir le projet dans Cursor.
  2. Créer un `.env` avec `DATABASE_URL` pointant vers la base à utiliser (ex. `file:C:/gesticom/gesticom.db` ou un chemin local sans espaces).
  3. Lancer `npm install`, `npx prisma generate`, puis `npm run dev` pour reproduire et déboguer.
  4. Vérifier dans les logs quelle `DATABASE_URL` est utilisée au démarrage (`[lib/db] DATABASE_URL=...`) et que les écritures vont bien dans ce fichier.
  5. Si le portable est utilisé : vérifier que `scripts/portable-launcher.js` et `scripts/run-standalone.js` (généré) utilisent la même URL que celle affichée par le launcher (« DONNEES ENREGISTREES DANS : ... »).

---

## Fichiers clés pour le portable et la base

- `lib/db.ts` : création du client Prisma, lecture éventuelle de `.database_url` / `database_url.txt`.
- `scripts/portable-launcher.js` : détermine l’URL de la base, écrit `.database_url` et lance le serveur.
- `scripts/build-portable.js` : build du dossier GestiCom-Portable.
- `docs/CONVENTION_BASE_PORTABLE.md`, `docs/CONSEILS_PERFORMANCE_ET_BUILD_PORTABLE.md`, `docs/CHECKLIST_PRODUCTION.md` : conventions et checklist.

---

## Commande pour lancer en dev (après clone sur le PC de prod)

```bash
npm install
npx prisma generate
# Créer .env avec DATABASE_URL=file:C:/chemin/sans/espaces/gesticom.db
npm run dev
```

Puis ouvrir http://localhost:3000 et tester les enregistrements. Vérifier les logs du terminal pour `[lib/db] DATABASE_URL=...`.
