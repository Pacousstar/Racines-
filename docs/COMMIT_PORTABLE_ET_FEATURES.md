# Commit et push — Build portable réussi

Exécuter dans le dossier du projet (PowerShell) :

```powershell
cd "c:\Users\GSN EXPETISES  GROUP\Projets\gesticom"

# Ajouter les fichiers modifiés et nouveaux (hors temporaires / PWA)
git add app/ lib/ scripts/

# Ne pas ajouter le fichier temporaire Word si présent
git reset -- "docs/~*" 2>$null

# Vérifier
git status

# Commit
git commit -m "Portable: fix ENOTEMPTY build, LOCALAPPDATA unique, Super Admin suppressions, permissions personnalisées, messages et vert accent"

# Push
git push origin master
```

Résumé des changements inclus :
- **Portable** : nettoyage .next/standalone avant build (fix ENOTEMPTY), URL base unique LOCALAPPDATA, run-standalone + lib/db + ensure-schema alignés
- **Super Admin** : suppression définitive ventes, achats, dépenses, charges, caisse, opérations banque, clients, fournisseurs + écritures comptables et stocks
- **Permissions** : priorité aux permissions personnalisées lors de l’enregistrement (Miss Fofana / Hamed)
- **UI** : vert accent #0D6B0D (accueil + login), lib/messages.ts, messages succès/403 harmonisés
- **API** : routes DELETE caisse/[id], banques/operations/[id], lib/delete-ecritures.ts
