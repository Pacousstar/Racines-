# Implémentation Multi-Entité - GestiCom

**Date :** Février 2026  
**État :** ✅ **Partiellement implémenté** (Sélecteur UI + APIs principales)

---

## ✅ Ce qui a été fait

### 1. Session avec entiteId
- ✅ Ajout de `entiteId` dans le type `Session` (`lib/auth.ts`)
- ✅ Inclusion de `entiteId` dans le token JWT lors du login
- ✅ Mise à jour de l'API `/api/auth/check` pour retourner `entiteId`

### 2. Sélecteur d'entité dans l'UI
- ✅ Ajout du sélecteur dans le header (`DashboardLayoutClient.tsx`)
- ✅ Visible pour SUPER_ADMIN ou si plusieurs entités disponibles
- ✅ Dropdown avec liste des entités actives
- ✅ Indication de l'entité actuellement sélectionnée
- ✅ API `/api/auth/switch-entite` pour changer d'entité

### 3. Fonction utilitaire
- ✅ Création de `lib/get-entite-id.ts` pour centraliser la logique
  - SUPER_ADMIN : utilise l'entité de la session (peut être changée)
  - Autres rôles : utilise l'entité de l'utilisateur en base (sécurité)

### 4. APIs modifiées
- ✅ `/api/ventes` (GET et POST) : Filtrage par entité + utilisation de `getEntiteId`
- ✅ `/api/achats` (GET et POST) : Filtrage par entité + utilisation de `getEntiteId`
- ✅ `/api/depenses` (GET et POST) : Filtrage par entité + utilisation de `getEntiteId`
- ✅ `/api/charges` (GET et POST) : Filtrage par entité + utilisation de `getEntiteId`
- ✅ `/api/caisse` (GET et POST) : Filtrage par entité via magasin + utilisation de `getEntiteId`
- ✅ `/api/stock/entree` (POST) : Vérification entité + utilisation de `getEntiteId`
- ✅ `/api/stock/sortie` (POST) : Vérification entité + utilisation de `getEntiteId`
- ✅ `/api/stock/inventaire` (POST) : Utilisation de `getEntiteId`
- ✅ `/api/magasins` (GET et POST) : Filtrage par entité + utilisation de `getEntiteId`
- ✅ `/api/produits` (POST) : Vérification que le magasin appartient à l'entité

---

## ✅ Toutes les APIs critiques sont maintenant modifiées !

### Note importante
- **Clients et Fournisseurs** : Ces modèles n'ont pas de champ `entiteId` dans le schéma Prisma car ils sont partagés entre toutes les entités (catalogue commun). Le filtrage se fait indirectement via les ventes/achats qui sont déjà filtrés par entité.
- **Produits** : Le catalogue de produits est également partagé, mais les stocks sont filtrés par magasin (qui est filtré par entité).

### APIs restantes (optionnelles)
11. **`/api/rapports`** : Filtrer les données par entité
12. **`/api/comptabilite/*`** : Filtrer les écritures par entité
13. **`/api/dashboard`** : Statistiques par entité

---

## 📝 Guide de modification d'une API

### Pour une API GET (lecture)

```typescript
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const where: { entiteId?: number } = {}
  
  // Filtrer par entité de la session (sauf SUPER_ADMIN qui voit tout)
  if (session.role !== 'SUPER_ADMIN' && session.entiteId) {
    where.entiteId = session.entiteId
  }

  const data = await prisma.model.findMany({
    where,
    // ... reste de la requête
  })

  return NextResponse.json(data)
}
```

### Pour une API POST (création)

```typescript
import { getEntiteId } from '@/lib/get-entite-id'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    // ... validation des données ...

    // Utiliser l'entité de la session
    const entiteId = await getEntiteId(session)

    // Vérifier que les ressources (magasin, etc.) appartiennent à l'entité
    const magasin = await prisma.magasin.findUnique({ where: { id: magasinId } })
    if (session.role !== 'SUPER_ADMIN' && magasin.entiteId !== entiteId) {
      return NextResponse.json({ error: 'Ce magasin n\'appartient pas à votre entité.' }, { status: 403 })
    }

    const data = await prisma.model.create({
      data: {
        // ... autres champs ...
        entiteId: entiteId,
        // ...
      },
    })

    return NextResponse.json(data)
  } catch (e) {
    // ... gestion d'erreur ...
  }
}
```

---

## 🔒 Sécurité

### Règles importantes

1. **SUPER_ADMIN** peut :
   - Voir toutes les entités
   - Changer d'entité via le sélecteur
   - Créer des données pour n'importe quelle entité

2. **Autres rôles** :
   - Ne peuvent voir que les données de leur entité par défaut
   - Ne peuvent pas changer d'entité (même si le sélecteur est visible)
   - Doivent utiliser leur entité en base (pas celle de la session)

3. **Vérifications à faire** :
   - Vérifier que les magasins appartiennent à l'entité avant création
   - Filtrer toutes les requêtes GET par entité (sauf SUPER_ADMIN)
   - Ne jamais faire confiance à `session.entiteId` pour les non-SUPER_ADMIN

---

## 🧪 Tests à effectuer

1. **SUPER_ADMIN** :
   - [ ] Peut changer d'entité via le sélecteur
   - [ ] Voit toutes les données de toutes les entités
   - [ ] Peut créer des données pour n'importe quelle entité

2. **Autres rôles** :
   - [ ] Ne voient que les données de leur entité
   - [ ] Ne peuvent pas créer de données pour une autre entité
   - [ ] Le sélecteur ne leur permet pas de changer d'entité (ou n'est pas visible)

3. **Filtrage** :
   - [ ] Les listes (ventes, achats, etc.) sont filtrées par entité
   - [ ] Les statistiques du dashboard sont filtrées par entité
   - [ ] Les rapports sont filtrés par entité

---

## 📌 Notes

- Le sélecteur d'entité est visible uniquement si :
  - L'utilisateur est SUPER_ADMIN, OU
  - Il y a plusieurs entités actives dans le système

- Le changement d'entité recharge la page pour mettre à jour toutes les données

- Les données créées avant cette implémentation n'ont pas d'`entiteId` défini. Il faudra peut-être créer un script de migration pour les assigner.

---

*Document créé lors de l'implémentation du multi-entité - Février 2026*
