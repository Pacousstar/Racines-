# Vérification Produits Gesticom 1 & 2 (PDF) vs JSON/CSV

## Source PDF

- **Produits Gesticom 1.pdf** : designations, prix d’achat (PA=… ou …FR en fin de ligne), références magasins (Danané, Guiglo, Magasin 01/02/03, Stock 01/03). Une même désignation peut apparaître plusieurs fois (une ligne par magasin).
- **Produits Gesticom 2.pdf** : même structure.

## Fichiers d’import

- **GestiCom_Produits_Master.json** : tableau de produits avec `code`, `designation`, `categorie`, `prix_achat`, `prix_vente`, `seuil_min`, `magasins[]`, `stock_initial`. Les codes (ex. MOT0001) et catégories ont été ajoutés lors de la construction du fichier à partir des PDF.
- **GestiCom_Produits_Master.csv** : colonnes Code, Designation, Categorie, Prix_Achat, Prix_Vente, Stock_Initial, Seuil_Min.

## Correspondance PDF → JSON/CSV

Le JSON (et le CSV dérivé) a été constitué à partir des PDF Produits Gesticom 1 et 2 :

- Désignations reprises.
- Prix d’achat : extraits des motifs `PA=…`, `…FR`, `…fr` dans les PDF.
- Références magasins (Danané, Guiglo, Magasin 01/02/03, Stock 01/03) : à reporter dans le champ `magasins` du JSON si vous souhaitez créer les stocks produit×magasin à l’import. Sinon, utiliser **Stock > Initialiser stocks manquants** après import.
- Codes et catégories : générés ou déduits pour le JSON ; ils ne figurent pas tels quels dans les PDF.

Une **vérification exhaustive** (chaque ligne de produit des PDF présente dans le JSON, sans perte ni doublon) nécessiterait un script dédié (parsing des PDF, normalisation des désignations, comparaison). Pour un contrôle manuel : recherche par désignation dans le JSON/CSV et dans les PDF.

## Après import dans GestiCom

1. **Produits > Importer JSON** (ou **Importer CSV**) pour charger le catalogue.
2. **Paramètres > Magasins** : créer les magasins dont les codes correspondent à `magasins` dans le JSON (ex. MAG01 pour Magasin 01, etc.).
3. **Stock > Initialiser stocks manquants** pour créer les lignes Stock produit×magasin si `magasins` n’était pas renseigné dans le JSON.
4. Optionnel : `npm run enrichir:magasins` pour ajouter `magasins` aux produits du JSON, puis ré-importer.
