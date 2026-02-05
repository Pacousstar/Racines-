# Rôles et Permissions - GestiCom

## Vue d'ensemble

GestiCom utilise un système de rôles et permissions granulaire pour contrôler l'accès aux différentes fonctionnalités du système.

## Rôles disponibles

### 1. SUPER_ADMIN (Super Administrateur)
**Description** : Accès total au système. Gestion complète des utilisateurs, paramètres et sauvegardes.

**Tâches principales** :
- Gestion complète des utilisateurs (création, modification, suppression)
- Configuration des paramètres système
- Gestion des sauvegardes et restaurations
- Accès à toutes les fonctionnalités sans restriction

**Permissions** :
- ✅ Toutes les permissions

---

### 2. ADMIN (Administrateur)
**Description** : Gestion opérationnelle complète. Peut créer/modifier les données et gérer les utilisateurs.

**Tâches principales** :
- Gestion des utilisateurs (création, modification)
- Configuration des paramètres système
- Gestion des sauvegardes (création)
- Gestion complète des opérations commerciales

**Permissions** :
- ✅ Dashboard, Produits (vue, création, modification)
- ✅ Stocks (vue, entrée, sortie, initialisation)
- ✅ Ventes (vue, création, modification, annulation)
- ✅ Achats (vue, création, modification)
- ✅ Dépenses (vue, création, modification)
- ✅ Charges (vue, création, modification)
- ✅ Comptabilité (vue, rapports)
- ✅ Utilisateurs (vue, création, modification)
- ✅ Paramètres (vue, modification)
- ✅ Sauvegardes (vue, création)
- ❌ Suppression de produits, ventes, achats
- ❌ Restauration de sauvegardes
- ❌ Suppression d'utilisateurs

---

### 3. COMPTABLE (Comptable)
**Description** : Accès comptable. Consultation et validation des transactions, rapports financiers.

**Tâches principales** :
- Consultation de toutes les transactions
- Gestion des dépenses et charges
- Génération de rapports financiers
- Export de données comptables

**Permissions** :
- ✅ Dashboard, Produits (vue uniquement)
- ✅ Stocks (vue uniquement)
- ✅ Ventes (vue uniquement)
- ✅ Achats (vue uniquement)
- ✅ Dépenses (vue, création, modification)
- ✅ Charges (vue, création, modification)
- ✅ Comptabilité (vue, rapports, export)
- ❌ Modification des ventes, achats
- ❌ Gestion des stocks
- ❌ Gestion des utilisateurs
- ❌ Paramètres

---

### 4. GESTIONNAIRE (Gestionnaire)
**Description** : Gestion des opérations commerciales. Stocks, ventes, achats et dépenses.

**Tâches principales** :
- Gestion des produits (création, modification)
- Gestion des stocks (entrées, sorties)
- Gestion des ventes (création, modification)
- Gestion des achats (création, modification)
- Gestion des dépenses et charges (création)

**Permissions** :
- ✅ Dashboard, Produits (vue, création, modification)
- ✅ Stocks (vue, entrée, sortie)
- ✅ Ventes (vue, création, modification)
- ✅ Achats (vue, création, modification)
- ✅ Dépenses (vue, création)
- ✅ Charges (vue, création)
- ❌ Suppression de produits
- ❌ Annulation de ventes
- ❌ Comptabilité (rapports, export)
- ❌ Gestion des utilisateurs
- ❌ Paramètres

---

### 5. MAGASINIER (Magasinier)
**Description** : Gestion des stocks uniquement. Entrées et sorties de stock.

**Tâches principales** :
- Consultation des produits
- Gestion des stocks (entrées, sorties)
- Consultation des ventes et achats

**Permissions** :
- ✅ Dashboard, Produits (vue uniquement)
- ✅ Stocks (vue, entrée, sortie)
- ✅ Ventes (vue uniquement)
- ✅ Achats (vue uniquement)
- ❌ Création/modification de produits
- ❌ Création de ventes, achats
- ❌ Dépenses, charges
- ❌ Comptabilité
- ❌ Gestion des utilisateurs
- ❌ Paramètres

---

### 6. ASSISTANTE (Assistante)
**Description** : Saisie et consultation limitée. Création de ventes, achats et dépenses.

**Tâches principales** :
- Consultation des produits et stocks
- Création de ventes
- Création d'achats
- Création de dépenses

**Permissions** :
- ✅ Dashboard, Produits (vue uniquement)
- ✅ Stocks (vue uniquement)
- ✅ Ventes (vue, création)
- ✅ Achats (vue, création)
- ✅ Dépenses (vue, création)
- ❌ Modification de ventes, achats
- ❌ Gestion des stocks
- ❌ Charges
- ❌ Comptabilité
- ❌ Gestion des utilisateurs
- ❌ Paramètres

---

## Matrice des permissions

| Permission | SUPER_ADMIN | ADMIN | COMPTABLE | GESTIONNAIRE | MAGASINIER | ASSISTANTE |
|------------|-------------|-------|-----------|--------------|------------|------------|
| **Dashboard** |
| Vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Produits** |
| Vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Création | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Modification | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Suppression | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Stocks** |
| Vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Entrée | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Sortie | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Initialisation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ventes** |
| Vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Création | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Modification | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Suppression | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Annulation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Achats** |
| Vue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Création | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Modification | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Suppression | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Dépenses** |
| Vue | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Création | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Modification | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suppression | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Charges** |
| Vue | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Création | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modification | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suppression | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Comptabilité** |
| Vue | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rapports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Utilisateurs** |
| Vue | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Création | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Suppression | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Paramètres** |
| Vue | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modification | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Sauvegardes** |
| Vue | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Création | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Restauration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Suppression | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Implémentation technique

### Vérification des permissions

```typescript
import { hasPermission, type Permission } from '@/lib/roles-permissions'
import { requirePermission } from '@/lib/require-role'

// Dans une route API
const session = await getSession()
const error = requirePermission(session, 'ventes:create')
if (error) return error

// Dans un composant
if (hasPermission(session.role, 'produits:edit')) {
  // Afficher le bouton d'édition
}
```

### Rôles constants

```typescript
import { ROLES_ADMIN, ROLES_COMPTA, ROLES_USER_MANAGEMENT } from '@/lib/require-role'

// Vérifier si l'utilisateur est admin
if (ROLES_ADMIN.includes(session.role)) {
  // Accès admin
}
```

---

## Bonnes pratiques

1. **Principe du moindre privilège** : Attribuer le rôle le plus restrictif possible
2. **Audit régulier** : Vérifier périodiquement les rôles attribués
3. **Séparation des tâches** : Ne pas donner plusieurs rôles à un même utilisateur
4. **Documentation** : Documenter les changements de rôles

---

## Notes importantes

- Seul le **SUPER_ADMIN** peut supprimer des utilisateurs
- Seul le **SUPER_ADMIN** peut restaurer des sauvegardes
- Les **COMPTABLE** et **ADMIN** peuvent voir la comptabilité
- Les **MAGASINIER** et **ASSISTANTE** ont des accès très limités
