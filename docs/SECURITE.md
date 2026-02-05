# Sécurité — GestiCom

Mesures de sécurité en place et bonnes pratiques.

---

## Authentification et rôles

- **Session** : JWT (jose) dans un cookie `httpOnly`, `sameSite: lax`, `secure` en HTTPS.
- **Rôles** : `SUPER_ADMIN`, `ADMIN`, `COMPTABLE`, `GESTIONNAIRE`, `MAGASINIER`, `ASSISTANTE`.
- **Contrôle d'accès** :
  - **Paramètres** (GET/PATCH) : réservé à `SUPER_ADMIN` et `ADMIN`.
  - **Comptabilité** (page) : réservé à `SUPER_ADMIN` et `COMPTABLE`.
  - **Sauvegardes** (liste, création, téléchargement, restauration) : réservé à `SUPER_ADMIN` et `ADMIN`.
  - **Création d'utilisateurs** : réservé à `SUPER_ADMIN` et `ADMIN`.
  - **Suppression d'utilisateurs** : réservé à `SUPER_ADMIN` uniquement.

Le helper `requireRole(session, ROLES_ADMIN)` est utilisé dans les routes API concernées ; en cas de rôle insuffisant, la réponse est **403 Droits insuffisants**.

### Protection contre les attaques par force brute

- **Limitation des tentatives de connexion** : Maximum 5 tentatives par session
- **Verrouillage temporaire** : Après 5 tentatives échouées, le compte est temporairement verrouillé
- **Messages d'erreur génériques** : Les messages d'erreur ne révèlent pas si un login existe ou non

---

## Validation des entrées (Zod)

Les entrées des routes sensibles sont validées avec **Zod** pour limiter les abus et les injections :

- **Connexion** (`POST /api/auth/login`) : schéma `loginSchema` (login, motDePasse, redirect optionnel), longueurs max.
- **Restauration** (`POST /api/sauvegarde/restore`) : schéma `restoreSchema` (nom de fichier au format `gesticom-backup-YYYY-MM-DD-HHmmss.db` uniquement).
- **Paramètres** (`PATCH /api/parametres`) : schéma `parametresPatchSchema` (champs optionnels, longueurs max, TVA 0–100).

Les schémas sont dans `lib/validations.ts`. Toute entrée invalide renvoie **400** avec un message explicite.

---

## Bonnes pratiques

- **Secrets** : aucun secret (mot de passe, clé API) dans le code ; tout dans `.env`, `.env*` dans `.gitignore`.
- **Base de données** : pas de construction dynamique de requêtes SQL (Prisma uniquement) ; pas d'`eval`.
- **Audit des dépendances** : lancer régulièrement `npm run audit` (ou `npm audit`) et traiter les vulnérabilités critiques/hautes.
- **Mots de passe** : Minimum 8 caractères, hashés avec bcrypt (10 rounds).
- **Validation des entrées** : Toutes les entrées utilisateur sont validées avec Zod avant traitement.
- **Principe du moindre privilège** : Chaque utilisateur reçoit uniquement les permissions nécessaires à son rôle.
- **Séparation des rôles** : Un utilisateur ne peut avoir qu'un seul rôle à la fois.

## Système de permissions

GestiCom utilise un système de permissions granulaire basé sur les rôles. Voir `docs/ROLES_ET_PERMISSIONS.md` pour la documentation complète.

### Vérification des permissions

```typescript
import { requirePermission } from '@/lib/require-role'
import { hasPermission } from '@/lib/roles-permissions'

// Dans une route API
const error = requirePermission(session, 'ventes:create')
if (error) return error

// Dans un composant
if (hasPermission(session.role, 'produits:edit')) {
  // Afficher le bouton d'édition
}
```

---

## Commande d’audit

```bash
npm run audit
```

À exécuter après chaque `npm install` ou mise à jour de dépendances. En cas de vulnérabilités, suivre les recommandations affichées (mise à jour, correctif, etc.).

---

## Corrections appliquées (audit npm)

- **Next.js** : passage à la version **16.1.6** (correctifs DoS / Image Optimizer, PPR Resume, RSC deserialization). Voir [GHSA-9g9p-9gw9-jx7f](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f), [GHSA-5f7q-jpqc-wp7h](https://github.com/advisories/GHSA-5f7q-jpqc-wp7h), [GHSA-h25m-26qc-wcjf](https://github.com/advisories/GHSA-h25m-26qc-wcjf).
- **xlsx** : remplacement par **xlsx-prototype-pollution-fixed** (API compatible, correctifs prototype pollution et ReDoS). L’ancien package `xlsx` sur npm n’est plus maintenu ; ce fork applique les correctifs CVE-2023-30533 et GHSA-5pgg-2g8v-p4x9.

Après modification des dépendances, exécuter `npm install` puis `npm run audit` pour vérifier l’état.
