# Validation & Gestion d'Erreurs Améliorée - GestiCom

**Date :** Février 2026  
**État :** ✅ **Partiellement implémenté**

---

## ✅ Ce qui a été fait

### 1. Système de Toasts/Notifications
- ✅ **Composant Toast** (`components/ui/Toast.tsx`)
  - 4 types : success, error, warning, info
  - Animation d'entrée/sortie
  - Fermeture automatique (durée configurable)
  - Fermeture manuelle
- ✅ **Hook useToast** (`hooks/useToast.ts`)
  - Méthodes : `success()`, `error()`, `warning()`, `info()`
  - Gestion de l'état des toasts
- ✅ **Intégration dans DashboardLayoutClient**
  - Toasts disponibles dans tout le dashboard
  - Position : coin supérieur droit

### 2. Validations Centralisées
- ✅ **Extension de `lib/validations.ts`**
  - Schémas Zod pour : Produit, Client, Fournisseur, Magasin, Dépense, Charge, Écriture, Journal
  - Messages d'erreur explicites en français
  - Validations complexes (ex: client CREDIT doit avoir plafond)
- ✅ **Helpers de validation** (`lib/validation-helpers.ts`)
  - Fonction `validateForm()` pour valider avec Zod
  - Messages d'erreur standardisés (`ErrorMessages`)
  - Fonction `formatApiError()` pour formater les erreurs API

### 3. Exemple d'Intégration
- ✅ **Page Écritures Comptables** (`comptabilite/ecritures/page.tsx`)
  - Utilisation de `useToast` pour les notifications
  - Validation avec `ecritureSchema` avant soumission
  - Messages d'erreur améliorés
  - Toasts de succès/erreur

---

## 📋 Utilisation

### Dans une Page/Composant

```typescript
import { useToast } from '@/hooks/useToast'
import { validateForm, formatApiError } from '@/lib/validation-helpers'
import { clientSchema } from '@/lib/validations'

export default function MaPage() {
  const { success, error } = useToast()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const validation = validateForm(clientSchema, formData)
    if (!validation.success) {
      error(validation.error)
      return
    }
    
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      })
      
      const data = await res.json()
      if (res.ok) {
        success('Client créé avec succès.')
        // ... reset form, refresh list, etc.
      } else {
        error(formatApiError(data.error || 'Erreur'))
      }
    } catch (e) {
      error(formatApiError(e))
    }
  }
  
  return (
    // ... votre JSX
  )
}
```

### Types de Toasts

```typescript
const { success, error, warning, info } = useToast()

// Succès (vert, 5s par défaut)
success('Opération réussie !')

// Erreur (rouge, 7s par défaut)
error('Une erreur est survenue.')

// Avertissement (jaune, 5s par défaut)
warning('Attention : action irréversible.')

// Information (bleu, 5s par défaut)
info('Information importante.')
```

### Durée Personnalisée

```typescript
success('Message', 10000) // 10 secondes
error('Erreur critique', 0) // Ne se ferme pas automatiquement
```

---

## 🔄 Pages à Migrer (Priorité)

### Priorité Haute
1. **Clients** (`dashboard/clients/page.tsx`)
2. **Fournisseurs** (`dashboard/fournisseurs/page.tsx`)
3. **Produits** (`dashboard/produits/page.tsx`)
4. **Dépenses** (`dashboard/depenses/page.tsx`)
5. **Charges** (`dashboard/charges/page.tsx`)

### Priorité Moyenne
6. **Ventes** (`dashboard/ventes/page.tsx`)
7. **Achats** (`dashboard/achats/page.tsx`)
8. **Caisse** (`dashboard/caisse/page.tsx`)
9. **Stock** (`dashboard/stock/page.tsx`)
10. **Journaux** (`dashboard/comptabilite/journaux/page.tsx`)

### Priorité Basse
11. **Plan de Comptes** (`dashboard/comptabilite/plan-comptes/page.tsx`)
12. **Magasins** (via paramètres)
13. **Utilisateurs** (`dashboard/utilisateurs/page.tsx`)

---

## 📝 Guide de Migration

### Étape 1 : Importer les dépendances

```typescript
import { useToast } from '@/hooks/useToast'
import { validateForm, formatApiError } from '@/lib/validation-helpers'
import { clientSchema } from '@/lib/validations' // ou le schéma approprié
```

### Étape 2 : Utiliser le hook

```typescript
const { success, error } = useToast()
```

### Étape 3 : Valider avant soumission

```typescript
const validation = validateForm(clientSchema, formData)
if (!validation.success) {
  error(validation.error)
  return
}
```

### Étape 4 : Remplacer les `alert()` et `setErr()`

```typescript
// Avant
if (res.ok) {
  alert('Succès')
} else {
  setErr(data.error || 'Erreur')
}

// Après
if (res.ok) {
  success('Client créé avec succès.')
  resetForm()
  fetchList()
} else {
  error(formatApiError(data.error || 'Erreur'))
}
```

### Étape 5 : Gérer les erreurs réseau

```typescript
catch (e) {
  error(formatApiError(e))
}
```

---

## 🎨 Personnalisation

### Styles des Toasts

Les styles sont définis dans `components/ui/Toast.tsx` :
- **Success** : Vert (`bg-green-50`, `text-green-800`)
- **Error** : Rouge (`bg-red-50`, `text-red-800`)
- **Warning** : Jaune (`bg-yellow-50`, `text-yellow-800`)
- **Info** : Bleu (`bg-blue-50`, `text-blue-800`)

### Position

Par défaut, les toasts apparaissent en haut à droite. Pour changer :
- Modifier `ToastContainer` dans `components/ui/Toast.tsx`
- Classe CSS : `fixed top-20 right-4`

---

## ✅ Avantages

1. **Expérience utilisateur améliorée** : Notifications non-intrusives
2. **Messages d'erreur clairs** : Validation avec Zod + messages explicites
3. **Cohérence** : Même système dans toute l'application
4. **Maintenabilité** : Validations centralisées, faciles à modifier
5. **Accessibilité** : Toasts avec `role="alert"` pour les lecteurs d'écran

---

## 📌 Notes

- Les toasts remplacent progressivement les `alert()` et messages d'erreur inline
- Les validations Zod peuvent être réutilisées côté serveur
- Les messages d'erreur sont en français pour une meilleure compréhension
- Les toasts se ferment automatiquement après 5s (7s pour les erreurs)

---

*Document créé lors de l'implémentation du système de validation et notifications - Février 2026*
