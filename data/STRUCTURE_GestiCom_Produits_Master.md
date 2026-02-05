# Structure des fichiers catalogue GestiCom

## JSON : `data/GestiCom_Produits_Master.json`

L’import (bouton **Importer JSON** dans Produits) lit ce fichier et met à jour les **Produits** et, si le champ `magasins` est fourni, crée les **Stocks** produit×magasin manquants.

## CSV : `data/GestiCom_Produits_Master.csv`

Bouton **Importer CSV** : colonnes `ID, Code, Designation, Categorie, Prix_Achat, Prix_Vente, Stock_Initial, Seuil_Min`. Le CSV ne gère pas `magasins` ; après import, utilisez **Stock > Initialiser stocks manquants**.

## Format

Tableau JSON d’objets. Chaque objet peut contenir :

| Champ          | Type          | Obligatoire | Description |
|----------------|---------------|-------------|-------------|
| `code`         | string        | **Oui**     | Code unique du produit (mis en majuscules). |
| `designation`  | string        | **Oui**     | Libellé du produit. |
| `categorie`    | string        | Non         | Catégorie (défaut : `DIVERS`). |
| `prix_achat`   | number \| null| Non         | Prix d’achat (FCFA). |
| `prix_vente`   | number \| null| Non         | Prix de vente (FCFA). |
| `seuil_min`    | number        | Non         | Seuil d’alerte stock (défaut : 5). |
| `magasins`     | string[]      | Non         | Liste de **codes magasin** (ex. `MAG01`, `MAG02`). Pour chaque code, une ligne Stock (produit×magasin) est créée si elle n’existe pas (qté 0, ou `stock_initial` si un seul magasin). |
| `stock_initial`| number        | Non         | Si `magasins` contient **un seul** code, utilisé comme `quantite` et `quantiteInitiale` pour ce Stock. Sinon ignoré. |

Champs ignorés à l’import : `id`, `search_text`, et tout autre champ non listé.

## Règles

- Les lignes sans `code` ou sans `designation` valides sont ignorées.
- Si le `code` existe déjà : le produit est **mis à jour** (designation, catégorie, prix, seuil). Sinon il est **créé**.
- Les codes dans `magasins` doivent correspondre à des magasins **actifs** (voir Paramètres > Magasins). Les codes inconnus sont ignorés.
- Si `magasins` est absent ou vide : seuls les Produits sont traités. Utilisez **Initialiser stocks manquants** (Stock) pour créer les lignes Stock pour tous les produits×magasins actifs.

## Exemple minimal

```json
[
  {
    "code": "ART001",
    "designation": "Article exemple",
    "categorie": "DIVERS",
    "prix_achat": 1000,
    "prix_vente": 1500,
    "seuil_min": 5
  },
  {
    "code": "ART002",
    "designation": "Article avec magasins",
    "categorie": "PIECES",
    "prix_achat": 500,
    "magasins": ["MAG01", "MAG02"],
    "stock_initial": 10
  }
]
```

Pour `ART002`, si `magasins` contient un seul code (ex. `["MAG01"]`), `stock_initial: 10` est appliqué au Stock MAG01. S’il y a plusieurs codes, `stock_initial` est ignoré et les Stocks sont créés avec 0.

## Références magasins (Cahier des charges)

D’après les documents Produits Gesticom : Danané, Guiglo, Magasin 01/02/03, Stock 01/03. Saisir dans `magasins` les **codes** tels que définis dans Paramètres > Magasins (ex. `MAG01`, `MAG02`, etc.).
