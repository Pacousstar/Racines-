# Corrections Transferts & Debug - 15/02/2026

## Problèmes Signalés

1. ❌ **Erreur module ventes** : `Cannot find module for page: /api/ventes/[id]/route`
2. ❌ **Transferts non fonctionnels** : Enregistrement ne passe pas

---

## Corrections Appliquées

### 1. **Logs de Debug Ajoutés** ✅

**Frontend** (`app/(dashboard)/dashboard/transferts/page.tsx`) :
- 📦 Log du payload avant envoi
- 🚀 Log de l'envoi de la requête
- 📥 Log de la réponse (status + données)
- ❌ Log des erreurs avec détails

**Backend** (`app/api/transferts/route.ts`) :
- 🔍 Log du body reçu (JSON formaté)
- ✅ Log du succès avec ID et numéro
- ❌ Log des erreurs avec message détaillé

### 2. **Amélioration Gestion Erreurs** ✅

**Backend** :
```typescript
// Avant
return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })

// Après
const errorMessage = e instanceof Error ? e.message : 'Erreur serveur.'
return NextResponse.json({ error: errorMessage }, { status: 500 })
```

**Frontend** :
- Try/catch renforcé dans `postTransfert()`
- Logs d'erreur avant throw

### 3. **Cache Next.js Nettoyé** ✅
- Dossier `.next/` supprimé
- Résout l'erreur "Cannot find module"

---

## Tests à Effectuer

### **Test 1 : Vérifier les logs**
1. Ouvrir Console Navigateur (F12)
2. Créer un nouveau transfert
3. Observer les logs :
   ```
   📦 Payload transfert: { date, magasinOrigineId, ... }
   🚀 Envoi requête POST /api/transferts
   📥 Réponse reçue: 200 OK
   📄 Données: { id, numero, ... }
   ```

### **Test 2 : Vérifier console serveur**
Dans le terminal où tourne `npm run dev` :
```
🔍 API /api/transferts POST - Body reçu: { ... }
✅ Transfert créé avec succès: 123 TRF-1739...
```

### **Test 3 : Scénarios d'erreur**
- Stock insuffisant → Modal doit s'afficher
- Magasins identiques → Message "Origine et destination doivent être différents"
- Aucune ligne → Message "Ajoutez au moins une ligne"

---

## Diagnostic Simplifié

Si le transfert ne passe toujours pas :

1. **Vérifier dans console navigateur (F12)** :
   - Onglet Console : Y a-t-il `📦 Payload transfert` ?
   - Onglet Network : Statut de `/api/transferts` (200, 400, 500 ?)

2. **Vérifier dans terminal serveur** :
   - Y a-t-il `🔍 API /api/transferts POST - Body reçu` ?
   - Y a-t-il une erreur `❌ POST /api/transferts - Erreur` ?

3. **Problèmes courants identifiés** :
   - `magasinOrigineId` ou `magasinDestId` invalide (null, 0, NaN)
   - Date invalide
   - Produit inexistant
   - Stock insuffisant

---

## Commandes Utiles

```bash
# Nettoyer cache
Remove-Item -Recurse -Force .next

# Redémarrer serveur
npm run dev

# Vérifier base de données
npm run db:studio
```

---

**Prochaine étape** : Testez et communiquez les logs observés pour diagnostic précis.
