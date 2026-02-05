# Guide d'import Excel pour GestiCom

## Format des fichiers Excel

### Produits

Colonnes requises :
- **Code** : Code unique du produit (obligatoire)
- **Designation** : Nom du produit (obligatoire)

Colonnes optionnelles :
- **Categorie** : Catégorie du produit (défaut: DIVERS)
- **PrixAchat** : Prix d'achat (nombre)
- **PrixVente** : Prix de vente (nombre)
- **SeuilMin** : Seuil minimum de stock (défaut: 5)

**Exemple :**
```
Code    | Designation        | Categorie | PrixAchat | PrixVente | SeuilMin
PROD001 | Produit exemple    | DIVERS    | 1000      | 1500      | 10
PROD002 | Autre produit      | ALIMENTAIRE| 500       | 800       | 5
```

**Note :** Les noms de colonnes peuvent être en minuscules ou majuscules (Code ou code, Designation ou designation, etc.)

### Clients

Colonnes requises :
- **Nom** : Nom du client (obligatoire)

Colonnes optionnelles :
- **Telephone** : Numéro de téléphone
- **Type** : Type de client (CREDIT ou CASH, défaut: CASH)
- **PlafondCredit** : Plafond de crédit si Type=CREDIT

### Fournisseurs

Colonnes requises :
- **Nom** : Nom du fournisseur (obligatoire)

Colonnes optionnelles :
- **Telephone** : Numéro de téléphone
- **Email** : Adresse email

## Utilisation

### Import depuis l'interface

1. **Produits** : Allez dans `/dashboard/produits` et cliquez sur "Importer Excel"
2. Sélectionnez votre fichier Excel (.xlsx ou .xls)
3. L'import se fait automatiquement

### Import via API (pour développeurs)

```bash
curl -X POST http://localhost:3000/api/import/excel \
  -H "Cookie: session=..." \
  -F "file=@produits.xlsx" \
  -F "type=produits"
```

Types disponibles : `produits`, `clients`, `fournisseurs`

## Import GestiCom CA+ (script)

Pour importer les onglets **Nouveau produit** et **Nouvel achat** du fichier `docs/GestiCom CA+.xlsx` :

```bash
npm run import:ca-plus
```

Voir aussi la doc BD portable et `scripts/import-ca-plus.js`.

## Comportement

- **Création** : Si l'enregistrement n'existe pas, il est créé
- **Mise à jour** : Si l'enregistrement existe (par Code pour produits, par Nom pour clients/fournisseurs), il est mis à jour
- **Erreurs** : Les erreurs sont collectées et affichées à la fin de l'import

## Notes importantes

1. La première feuille du fichier Excel est utilisée (sauf pour import-ca-plus qui utilise des onglets nommés)
2. La première ligne peut être un en-tête (elle sera ignorée si elle ne contient pas de données valides)
3. Les lignes avec des données manquantes obligatoires sont ignorées
4. Les valeurs numériques doivent être des nombres valides
