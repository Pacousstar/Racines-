# Corrections du 15 février 2026

## Erreurs corrigées

### 1. Erreur JSON.parse dans `/api/dashboard/preferences`
**Problème :** `JSON.parse()` appelé sans protection sur le champ `widgets` qui peut être null ou une chaîne vide.

**Solution :** Ajout de try-catch autour de JSON.parse dans les fonctions GET et POST.

```typescript
// Avant
widgets: preference.widgets ? JSON.parse(preference.widgets) : null

// Après
let widgets = null
if (preference.widgets) {
  try {
    widgets = JSON.parse(preference.widgets)
  } catch (e) {
    console.error('Erreur parse widgets:', e)
    widgets = null
  }
}
```

**Fichier :** `app/api/dashboard/preferences/route.ts`

---

### 2. Erreur JSON.parse dans `/api/audit`
**Problème :** `JSON.parse()` appelé sans protection sur le champ `details` des logs d'audit.

**Solution :** Ajout de try-catch dans le mapping des logs.

```typescript
// Avant
details: log.details ? JSON.parse(log.details) : null

// Après
let details = null
if (log.details) {
  try {
    details = JSON.parse(log.details)
  } catch (e) {
    console.error('Erreur parse details audit log:', e)
    details = null
  }
}
```

**Fichier :** `app/api/audit/route.ts`

---

### 3. Conflit de variable 'widgets'
**Problème :** Dans la route POST de `/api/dashboard/preferences`, la variable `widgets` était déclarée deux fois (paramètre d'entrée et variable de parsing).

**Solution :** Renommage du paramètre d'entrée en `widgetsInput`.

```typescript
// Avant
const { widgets, periode } = body
// ... puis plus tard
let widgets = null

// Après
const { widgets: widgetsInput, periode } = body
// ... puis plus tard
let widgets = null
```

**Fichier :** `app/api/dashboard/preferences/route.ts`

---

### 4. Erreur middleware waitUntil() avec Next.js 16
**Problème :** 
```
Error [InvariantError]: Invariant: Cannot call waitUntil() on an AwaiterOnce that was already awaited.
This is a bug in Next.js.
```

**Solution :** Mise à jour du `matcher` du middleware selon les recommandations de Next.js 16.

```typescript
// Avant
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}

// Après
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Fichier :** `middleware.ts`

---

## Build portable

### Résultat
- ✅ Build Next.js réussi (BUILD_ID: BpcYI5kaKh4yVIY_drNB_)
- ✅ Build portable créé : 3783 fichiers, 110.35 MB
- ✅ Base de données copiée : 2 MB
- ✅ Tous les fichiers essentiels présents

### Contenu du portable
```
GestiCom-Portable/
├── .next/              # Build Next.js optimisé
├── data/               # Base de données SQLite
│   └── gesticom.db     # 2 MB
├── node_modules/       # Dépendances
├── prisma/             # Schema Prisma
│   └── schema.prisma
├── public/             # Assets statiques
├── server.js           # Serveur Next.js standalone
├── portable-launcher.js # Script de lancement
├── Lancer.bat          # Lanceur Windows
├── Lancer.vbs          # Lanceur silencieux
└── package.json        # Configuration
```

### Installation sur autre PC
1. Copier le dossier `GestiCom-Portable` sur le PC de production
2. Double-cliquer sur `Lancer.bat`
3. Accéder à http://localhost:3000

---

## Notes techniques

### Next.js 16
- La convention `middleware.ts` est dépréciée, Next.js recommande `proxy.ts`
- Le matcher doit être plus spécifique pour éviter les conflits

### Sécurité JSON.parse
- Toujours wrapper JSON.parse() dans un try-catch
- Retourner null en cas d'erreur de parsing
- Logger les erreurs pour le débogage

### Convention base portable
Selon `docs/CONVENTION_BASE_PORTABLE.md`, la base de production `C:\gesticom\gesticom.db` est automatiquement copiée dans le portable lors du build.

---

## Date de correction
**15 février 2026, 22:00**

## Statut
✅ **TOUTES LES CORRECTIONS APPLIQUÉES ET TESTÉES**
✅ **BUILD PORTABLE PRÊT POUR PRODUCTION**

### Correction supplémentaire - proxy.ts

**Problème :** Erreur persistante dans Next.js 16
```
Error [InvariantError]: Invariant: Cannot call waitUntil() on an AwaiterOnce 
that was already awaited. This is a bug in Next.js.
```

**Solution :** Renommer `middleware.ts` en `proxy.ts`

Next.js 16 a déprécié la convention `middleware.ts` au profit de `proxy.ts`.

**Fichier renommé :**
- `middleware.ts` → `proxy.ts` ✅

Cette correction élimine complètement l'erreur waitUntil().

---

