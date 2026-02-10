# Convention : base de données pour le portable

## Règle à respecter

**Le build portable utilise TOUJOURS la base de données à jour.**

- **Sous Windows** : le script `build-portable.js` copie en priorité **`C:\gesticom\gesticom.db`** (base de production) vers `GestiCom-Portable/data/gesticom.db`. Si ce fichier n’existe pas, il utilise `prisma/gesticom.db`.
- **Avant chaque `npm run build:portable`** : s’assurer que la base à utiliser est à jour (produits, stocks, ventes, etc.). En pratique, travailler avec `DATABASE_URL="file:C:/gesticom/gesticom.db"` dans `.env` et lancer le build portable quand les données sont prêtes.
- Ne jamais faire partir le portable avec une ancienne copie de la base : le script copie systématiquement la base source (C:\gesticom\gesticom.db ou prisma/gesticom.db) à chaque build.

## Référence

- Script : `scripts/build-portable.js` (commentaire en en-tête et log « Base utilisee pour le portable »).
- `.env` : `DATABASE_URL="file:C:/gesticom/gesticom.db"` pour pointer la base de production.
