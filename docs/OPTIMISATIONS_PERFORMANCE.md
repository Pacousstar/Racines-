# Optimisations de performance - Base de données

Ce document décrit les optimisations effectuées pour améliorer les performances de chargement de la base de données.

## Problèmes identifiés

1. **Requête inefficace dans le dashboard** : La requête des stocks faibles chargeait TOUS les stocks avec leurs produits, puis filtrait en mémoire. Avec 3289 produits, cela était très lent.

2. **Index manquants** : Plusieurs colonnes fréquemment utilisées dans les requêtes WHERE n'avaient pas d'index :
   - `Stock.quantite` (utilisé pour filtrer `quantite > 0` et `quantite < seuilMin`)
   - `Stock.produitId` et `Stock.magasinId` (utilisés dans les JOIN)
   - `Produit.actif` (utilisé dans presque toutes les requêtes produits)
   - `Client.actif` (utilisé pour compter les clients actifs)

## Optimisations effectuées

### 1. Ajout d'index dans le schéma Prisma

Les index suivants ont été ajoutés dans `prisma/schema.prisma` :

```prisma
model Produit {
  // ...
  @@index([actif])  // NOUVEAU
}

model Stock {
  // ...
  @@index([produitId])  // NOUVEAU
  @@index([magasinId])  // NOUVEAU
  @@index([quantite])   // NOUVEAU
}

model Client {
  // ...
  @@index([actif])  // NOUVEAU
}
```

### 2. Optimisation de la requête des stocks faibles

**Avant** (lent) :
```typescript
prisma.stock.findMany({
  where: { produit: { actif: true } },
  include: { produit: {...}, magasin: {...} },
}).then((list) => list.filter((s) => s.quantite < s.produit.seuilMin).slice(0, 5))
```

**Après** (rapide) :
```typescript
prisma.$queryRaw`
  SELECT s.id, s.quantite, p.designation, p."seuilMin", p.categorie, m.code
  FROM "Stock" s
  INNER JOIN "Produit" p ON s."produitId" = p.id
  INNER JOIN "Magasin" m ON s."magasinId" = m.id
  WHERE p.actif = 1 AND s.quantite < p."seuilMin"
  ORDER BY s.quantite ASC
  LIMIT 5
`
```

Cette requête filtre directement en base de données au lieu de charger tous les stocks en mémoire.

## Application des optimisations

### Étape 1 : Appliquer les nouveaux index

Exécutez les commandes suivantes pour créer les index dans la base de données :

```bash
npx prisma generate
npx prisma db push
```

Ou si vous utilisez les migrations :

```bash
npx prisma migrate dev --name add_performance_indexes
```

### Étape 2 : Vérifier les performances

Après avoir appliqué les index, testez le chargement du dashboard :

1. Ouvrez le dashboard (`/dashboard`)
2. Vérifiez que le temps de chargement est réduit
3. Vérifiez que les stocks faibles s'affichent correctement

### Étape 3 : Vérifier les index créés (optionnel)

Pour vérifier que les index ont bien été créés dans SQLite :

```bash
sqlite3 prisma/gesticom.db ".indexes Stock"
sqlite3 prisma/gesticom.db ".indexes Produit"
sqlite3 prisma/gesticom.db ".indexes Client"
```

## Résultats attendus

- **Temps de chargement du dashboard** : Réduction de 50-80% (de plusieurs secondes à moins d'1 seconde)
- **Requête des stocks faibles** : Réduction de 90%+ (de plusieurs secondes à quelques millisecondes)
- **Requêtes de comptage** : Amélioration de 30-50% grâce aux index sur `actif`

## Notes importantes

- Les index améliorent les performances de lecture mais peuvent légèrement ralentir les écritures. Pour une application de gestion avec beaucoup plus de lectures que d'écritures, c'est un bon compromis.

- Les index prennent un peu d'espace disque supplémentaire, mais c'est négligeable par rapport aux gains de performance.

- Si vous avez une très grande base de données (plusieurs dizaines de milliers de produits), vous pourriez envisager d'autres optimisations comme la pagination côté serveur ou le cache.

## Maintenance

Les index sont automatiquement maintenus par SQLite lors des opérations INSERT/UPDATE/DELETE. Aucune maintenance manuelle n'est nécessaire.
