# Bugs Potentiels et Corrections - GestiCom

**Date :** Février 2026  
**Version :** 0.1.0

---

## 🔍 Vérification des Bugs

### ✅ Bugs Corrigés Récemment

1. **Erreur "clients.map is not a function"**
   - **Cause** : Variable `clients` n'était pas toujours un tableau
   - **Correction** : Ajout de vérifications `Array.isArray()` avant `.map()`
   - **Fichiers** : `app/(dashboard)/dashboard/ventes/page.tsx`, `app/(dashboard)/dashboard/recherche/page.tsx`

2. **Données manquantes dans Rapports**
   - **Cause** : `useEffect` initial ne chargeait pas les données
   - **Correction** : Ajout d'un `useEffect` pour charger au premier rendu
   - **Fichiers** : `app/(dashboard)/dashboard/rapports/page.tsx`

3. **Pagination non visible**
   - **Cause** : Condition d'affichage trop restrictive
   - **Correction** : Affichage de la pagination même avec peu de données
   - **Fichiers** : `app/(dashboard)/dashboard/rapports/page.tsx`

4. **Filtrage par entité manquant**
   - **Cause** : API rapports ne filtrait pas par `entiteId`
   - **Correction** : Ajout du filtre dans `app/api/rapports/route.ts`
   - **Fichiers** : `app/api/rapports/route.ts`

---

## ⚠️ Bugs Potentiels à Surveiller

### 1. Gestion des Chemins avec Espaces (Portable)

**Statut** : ✅ Corrigé (voir `docs/PERSISTANCE_BD_PORTABLE.md`)

**Description** : Sur les chemins avec espaces, la base de données était écrasée à chaque démarrage.

**Solution** : Le launcher vérifie maintenant si `C:\gesticom_portable_data\gesticom.db` existe avant de copier depuis `data/`.

---

### 2. Concurrence des Requêtes API

**Statut** : ⚠️ À surveiller

**Description** : Plusieurs requêtes simultanées peuvent causer des problèmes de performance.

**Recommandation** :
- Implémenter un système de cache côté client
- Utiliser `React Query` ou `SWR` pour la gestion des requêtes
- Ajouter un debounce sur les recherches

---

### 3. Validation des Données

**Statut** : ✅ Partiellement corrigé

**Description** : Certains formulaires n'avaient pas de validation robuste.

**Solution** : Migration vers `lib/validations.ts` avec Zod (en cours).

**Pages restantes** :
- [ ] Stock (entrées/sorties)
- [ ] Paramètres (entreprise, magasins)

---

### 4. Gestion des Erreurs API

**Statut** : ✅ Amélioré

**Description** : Messages d'erreur peu explicites.

**Solution** : Système de toasts avec messages clairs.

**À améliorer** :
- Messages d'erreur plus contextuels
- Codes d'erreur HTTP standardisés

---

### 5. Performance avec Grandes Listes

**Statut** : ✅ Corrigé (pagination implémentée)

**Description** : Les listes longues causaient des ralentissements.

**Solution** : Pagination sur toutes les listes principales.

**Pages avec pagination** :
- ✅ Ventes
- ✅ Achats
- ✅ Produits
- ✅ Clients
- ✅ Fournisseurs
- ✅ Rapports (Alertes stock, Top produits)

---

### 6. Synchronisation Multi-Entité

**Statut** : ✅ Fonctionnel

**Description** : Changement d'entité nécessitait un rechargement complet.

**Solution** : Rechargement automatique après changement d'entité.

**À améliorer** :
- Cache des données par entité
- Synchronisation plus fluide

---

## 🐛 Bugs Connus (Non-Critiques)

### 1. Timeout sur Grandes Requêtes

**Description** : Les requêtes avec beaucoup de données peuvent timeout.

**Impact** : Faible (pagination résout le problème)

**Solution** : Pagination déjà implémentée.

---

### 2. Format des Dates

**Description** : Certaines dates peuvent s'afficher différemment selon le navigateur.

**Impact** : Faible (cosmétique)

**Solution** : Utiliser `toLocaleDateString('fr-FR')` partout.

---

### 3. Export Excel avec Caractères Spéciaux

**Description** : Les caractères spéciaux peuvent ne pas s'afficher correctement dans Excel.

**Impact** : Faible

**Solution** : Encodage UTF-8 avec BOM dans les exports.

---

## 🔧 Améliorations Recommandées

### 1. Rate Limiting

**Priorité** : Moyenne

**Description** : Ajouter un rate limiting sur les APIs pour éviter les abus.

**Solution** : Utiliser `express-rate-limit` ou middleware Next.js.

---

### 2. Validation Côté Serveur Renforcée

**Priorité** : Haute

**Description** : Toutes les validations doivent être dupliquées côté serveur.

**Statut** : ✅ En cours (Zod schemas)

---

### 3. Tests Automatisés

**Priorité** : Moyenne

**Description** : Ajouter des tests pour éviter les régressions.

**Solution** : Jest ou Vitest pour les tests unitaires et d'intégration.

---

### 4. Monitoring et Logging

**Priorité** : Basse

**Description** : Ajouter un système de logging avancé.

**Solution** : Winston ou Pino pour les logs structurés.

---

## ✅ Checklist de Vérification

Avant chaque déploiement, vérifier :

- [ ] Tous les formulaires ont une validation
- [ ] Tous les messages d'erreur sont explicites
- [ ] La pagination fonctionne sur toutes les listes
- [ ] Le filtrage par entité fonctionne partout
- [ ] Les exports (Excel/PDF) fonctionnent
- [ ] Le mode hors-ligne (PWA) fonctionne
- [ ] Les sauvegardes fonctionnent
- [ ] Les permissions sont respectées
- [ ] Pas d'erreurs dans la console
- [ ] Performance acceptable (< 2s pour les pages principales)

---

## 📞 Signaler un Bug

Pour signaler un bug :

1. **Décrire le problème** : Ce qui se passe vs ce qui devrait se passer
2. **Étapes pour reproduire** : Comment reproduire le bug
3. **Environnement** :
   - OS et version
   - Navigateur et version
   - Version de GestiCom
4. **Logs** : Messages d'erreur dans la console
5. **Capture d'écran** : Si applicable

---

**Dernière mise à jour** : Février 2026
