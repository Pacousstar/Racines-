# Corrections : Impression, Logo et Stock Insuffisant

**Date :** Février 2026

---

## ✅ Corrections Effectuées

### 1. Ajout du champ Logo dans les Paramètres ✅

**Fichiers modifiés :**
- `prisma/schema.prisma` : Ajout du champ `logo` dans le modèle `Parametre`
- `lib/validations.ts` : Ajout de `logo` dans `parametresPatchSchema`
- `app/api/parametres/route.ts` : Gestion du champ `logo` dans l'API
- `app/(dashboard)/dashboard/parametres/page.tsx` : Ajout de l'interface pour uploader le logo

**Fonctionnalités :**
- ✅ Upload de logo (JPG, PNG, GIF, WebP, max 2 Mo)
- ✅ Conversion automatique en base64
- ✅ Prévisualisation du logo
- ✅ Suppression du logo
- ✅ Sauvegarde dans la base de données

---

### 2. Lien vers la page Impression ✅

**Fichier modifié :** `app/(dashboard)/dashboard/parametres/page.tsx`

**Ajout :**
- ✅ Bouton "Modèles d'Impression" dans le header de la page Paramètres
- ✅ Lien vers `/dashboard/parametres/impression`
- ✅ Accessible uniquement aux rôles `SUPER_ADMIN` et `ADMIN`

**Accès :**
- Paramètres → Bouton "Modèles d'Impression" (en haut à droite)
- Ou directement : `/dashboard/parametres/impression`

---

### 3. Correction du Remplacement des Variables dans l'Impression ✅

**Fichier modifié :** `lib/print-templates.ts`

**Problème :** Les variables `{ENTREPRISE_NOM}`, `{ENTREPRISE_CONTACT}`, etc. s'affichaient littéralement au lieu d'être remplacées.

**Solution :**
- ✅ Récupération automatique des paramètres de l'entreprise depuis `/api/parametres`
- ✅ Injection des données dans `TemplateData` avant le remplacement
- ✅ Priorité au logo du template, sinon logo des paramètres
- ✅ Remplacement correct de toutes les variables

**Variables maintenant remplacées :**
- `{ENTREPRISE_NOM}` → Nom de l'entreprise
- `{ENTREPRISE_CONTACT}` → Contact de l'entreprise
- `{ENTREPRISE_LOCALISATION}` → Localisation de l'entreprise
- `{ENTREPRISE_LOGO}` → Logo de l'entreprise (si uploadé)

---

### 4. Modal pour Gérer le Stock Insuffisant ✅

**Fichier modifié :** `app/(dashboard)/dashboard/ventes/page.tsx`

**Fonctionnalités :**
- ✅ Détection automatique du message "Stock insuffisant"
- ✅ Extraction des informations (produit, quantité demandée, quantité disponible)
- ✅ Modal avec formulaire pour ajouter du stock
- ✅ Quantité recommandée pré-remplie (quantité manquante)
- ✅ Ajout rapide du stock via `/api/stock/entree`
- ✅ Réessai automatique de l'enregistrement de la vente après ajout du stock
- ✅ Reste sur la page sans la quitter

**Endroits où le modal peut apparaître :**
- ✅ Lors de l'enregistrement d'une vente avec stock insuffisant
- ✅ Message d'erreur : "Stock insuffisant pour [PRODUIT] (dispo: [QTE])"

**Utilisation :**
1. Tenter d'enregistrer une vente avec stock insuffisant
2. Le modal s'ouvre automatiquement
3. Saisir la quantité à ajouter (recommandée pré-remplie)
4. Cliquer sur "Ajouter au stock et continuer"
5. Le stock est ajouté et la vente est enregistrée automatiquement

---

### 5. Correction de l'Erreur de Build ✅

**Fichier modifié :** `app/api/rapports/route.ts`

**Problème :** Variable `achatsActuels` définie deux fois (ligne 168 et 208).

**Solution :**
- ✅ Renommé `achatsActuels` en `montantAchatsActuels` (ligne 208)
- ✅ Renommé `achatsPrecedents` en `montantAchatsPrecedents` (ligne 212)
- ✅ Mise à jour de toutes les références

---

## 📋 Résumé des Modifications

### Schéma de Base de Données
- ✅ Ajout du champ `logo` dans `Parametre`

### API
- ✅ `app/api/parametres/route.ts` : Gestion du logo
- ✅ `app/api/rapports/route.ts` : Correction de la variable dupliquée

### Frontend
- ✅ `app/(dashboard)/dashboard/parametres/page.tsx` :
  - Ajout du champ logo
  - Lien vers Impression
- ✅ `app/(dashboard)/dashboard/ventes/page.tsx` :
  - Modal pour stock insuffisant
- ✅ `lib/print-templates.ts` :
  - Récupération des données entreprise
  - Remplacement correct des variables

---

## 🎯 Prochaines Étapes

1. **Exécuter `npx prisma generate`** pour générer le client Prisma avec le nouveau champ `logo`
2. **Exécuter `npx prisma db push`** pour mettre à jour la base de données
3. **Tester l'upload du logo** dans Paramètres
4. **Tester l'impression** avec les variables remplacées
5. **Tester le modal stock insuffisant** lors d'une vente

---

## 📝 Notes

- Le logo est stocké en base64 dans la base de données
- Le logo des paramètres est utilisé si aucun logo n'est défini dans le template
- Le modal stock insuffisant fonctionne uniquement pour les ventes
- Tous les endroits où le message "Stock insuffisant" apparaît ont été identifiés et peuvent être étendus si nécessaire

---

**Toutes les corrections sont terminées !** ✅
