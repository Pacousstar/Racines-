# Récapitulatif complet — Ancienne base (gesticomold.db)

**Objectif** : Valider ce récapitulatif avant de fusionner les enregistrements de l’ancienne version avec la nouvelle base GestiCom (3 289 produits) pour obtenir la version définitive de production.

**Fichier analysé** : `docs/gesticomold.db`  
**Rapport détaillé complet** : `docs/RECAP_ANCIENNE_BASE_gesticomold.txt` (liste exhaustive de tous les enregistrements)

---

## 1. Synthèse globale

| Élément | Nombre | Détail / Montant |
|--------|--------|-------------------|
| **Entités** | 1 | Maison Mère (MM01) |
| **Magasins** | 7 | MAG01, DANANE, GUIGLO, MAG02, MAG03, STK01, STK03 |
| **Utilisateurs** | 0 | Aucun (connexion probablement gérée ailleurs) |
| **Produits (catalogue)** | 596 | Répartition par catégorie ci‑dessous |
| **Lignes de stock** | 0 | Aucune ligne Stock dans l’ancienne base |
| **Mouvements de stock** | 77 | 53 entrées, 24 sorties |
| **Clients** | 0 | Aucun |
| **Fournisseurs** | 0 | Aucun |
| **Ventes** | 24 | **575 500 F** au total |
| **Achats** | 20 | **580 000 F** au total |
| **Opérations caisse** | 0 | Aucune |
| **Dépenses** | 6 | **16 000 F** au total |
| **Charges** | 0 | Aucune |
| **Comptes bancaires** | 0 | Aucun |
| **Opérations bancaires** | 0 | Aucune |
| **Plan de comptes / Journaux / Écritures** | 0 | Comptabilité non utilisée dans l’ancienne base |
| **Journal d’audit** | 0 | Aucune entrée |
| **Paramètres entreprise** | 0 | Aucun enregistrement |
| **Modèles d’impression** | 0 | Aucun |

---

## 2. Détail des enregistrements à reprendre

### 2.1 Entités (1)
- **[1] MM01** — Maison Mère | MAISON_MERE | Siège

### 2.2 Magasins (7)
- [1] **MAG01** — Magasin 01 | Siège  
- [2] **DANANE** — Danané | Danané  
- [3] **GUIGLO** — Guiglo | Guiglo  
- [4] **MAG02** — Magasin 02 | -  
- [5] **MAG03** — Magasin 03 | -  
- [6] **STK01** — Stock 01 | SIEGE  
- [7] **STK03** — Stock 03 | SIEGE  

### 2.3 Produits (596)
- **596 produits** avec code, désignation, catégorie, prix achat/vente (souvent 0 ou non renseigné).  
- **Répartition par catégorie** (extrait) : AUTRES (98), BOUCHONS (38), BAGUES (36), AMORTISSEURS (33), ACCESSOIRES (29), AMPOULES (26), BRIDES (26), HUILES & LIQUIDES (24), PHARES & FEUX (23), EMBRAYAGE (22), etc.  
- Liste exhaustive dans `RECAP_ANCIENNE_BASE_gesticomold.txt` (section 4).

**À noter** : La **nouvelle** base contient déjà **3 289 produits**. Les 596 produits de l’ancienne base peuvent être des doublons (même code) ou des produits supplémentaires. La fusion devra soit **ne pas réimporter** les produits existants (garder les 3 289), soit **ajouter uniquement les ventes, achats, mouvements, dépenses** en s’appuyant sur les codes produit existants dans la nouvelle base.

### 2.4 Mouvements de stock (77)
- **53 entrées** (réceptions, achats, inventaire).  
- **24 sorties** (ventes).  
- Magasins concernés : MAG02, STK01, STK03, DANANE, GUIGLO.  
- Chaque mouvement est lié à un **produit** (code) et à un **magasin**.  
- Liste complète dans `RECAP_ANCIENNE_BASE_gesticomold.txt` (section 6).

### 2.5 Ventes (24) — Montant total : 575 500 F
- Toutes **validées**, **payées** (PAYE).  
- Magasins : MAG02, STK01, STK03, GUIGLO.  
- Aucune fiche client utilisée (client libre ou vide).  
- **Numéros de vente** (ex.) : V1770210921751, V1770210772722, V1770205987731, V1770205778854, V1770204474498, V1770204263576, V1770201577649, V1770200892972, V1770200654272, V1770199755023, V1770139033113, V1770138677712, V1769855358523, V1769877924962, V1769877822631, V1769877659337, V1769877522027, V1769877418625, V1769877281065, etc.  
- Détail de chaque vente (date, magasin, lignes produit, quantités, PU, montants) dans `RECAP_ANCIENNE_BASE_gesticomold.txt` (section 9).

### 2.6 Achats (20) — Montant total : 580 000 F
- Tous **payés** (PAYE).  
- Magasins : MAG02, STK03.  
- Aucune fiche fournisseur (fournisseur libre ou vide).  
- **Numéros d’achat** (ex.) : A1770470669081, A1770470570595, A1770470519230, … A1769851538421.  
- Détail de chaque achat (date, magasin, lignes produit, quantités, PU, montants) dans `RECAP_ANCIENNE_BASE_gesticomold.txt` (section 10).

### 2.7 Dépenses (6) — Montant total : 16 000 F
- [6] 2026-01-31 — TRANSPORT — ESSENCE — 1 000 F  
- [5] 2026-01-31 — AUTRE — NOURRITURE — 2 000 F  
- [4] 2026-01-27 — AUTRE — FEMME DE MENAGE — 4 000 F  
- [3] 2026-01-27 — AUTRE — NOURRITURE — 2 000 F  
- [2] 2026-01-21 — AUTRE — FERRAILLEUR — 5 000 F  
- [1] 2026-01-21 — TRANSPORT — MOTO TAXI — 2 000 F  

Répartition : TRANSPORT (2), AUTRE (4). Aucun magasin renseigné.

---

## 3. Éléments vides (aucun enregistrement)

- **Utilisateurs** : 0  
- **Clients** : 0  
- **Fournisseurs** : 0  
- **Lignes de stock** : 0 (les mouvements existent mais pas la table Stock remplie)  
- **Opérations caisse** : 0  
- **Charges** : 0  
- **Comptes bancaires** : 0  
- **Opérations bancaires** : 0  
- **Paramètres entreprise** : 0  
- **Plan de comptes / Journaux / Écritures comptables** : 0  
- **Journal d’audit** : 0  
- **Modèles d’impression** : 0  

---

## 4. Ce qui sera à faire lors de la fusion (après validation)

1. **Conserver la nouvelle base** comme socle (3 289 produits, structure à jour).  
2. **Ne pas écraser** les produits existants ; faire correspondre les **codes produit** entre ancienne et nouvelle base pour les ventes/achats/mouvements.  
3. **Réinjecter dans la nouvelle base** (après votre validation) :  
   - **1 entité** (si pas déjà présente ou à fusionner).  
   - **7 magasins** (ou les faire correspondre aux magasins existants par code).  
   - **24 ventes** + leurs **lignes** (produit par code, magasin par code).  
   - **20 achats** + leurs **lignes**.  
   - **77 mouvements de stock** (entrées/sorties).  
   - **6 dépenses**.  
4. **Stocks** : recalculer ou alimenter les **stocks** à partir des mouvements si besoin (selon la règle métier retenue).  
5. **Utilisateurs / Clients / Fournisseurs** : rien à importer depuis l’ancienne base (0 enregistrement).

---

## 5. Script de mise à jour (implémenté)

Un **script dédié** a été mis en place pour appliquer la fusion avec les règles validées :

- **Fichier** : `scripts/mise-a-jour-depuis-ancienne-base.js`
- **Nomenclature unique** : correspondance des produits par **code** (exact puis **code normalisé** : trim, majuscules, sans tirets/espaces). Si aucun produit de la nouvelle base ne correspond, le produit de l’ancienne est ajouté avec son code → un seul catalogue cohérent.
- **Stocks** : la nouvelle base conserve ses **stocks initiaux** ; seuls les **mouvements** de l’ancienne base sont appliqués (entrées/sorties) sur les stocks de la cible (sans écraser les quantités initiales).
- **Comptabilité** : pour chaque vente, achat et dépense importés, des **écritures comptables** sont créées (plan de comptes et journaux créés si besoin : 531, 701, 601, 401, 658, journaux VE, AC, OD).

**Usage :**

```bash
node scripts/mise-a-jour-depuis-ancienne-base.js [chemin-base-source] [chemin-base-cible]
```

Par défaut : source = `docs/gesticomold.db`, cible = base définie par `DATABASE_URL` ou `prisma/gesticom.db`. Une sauvegarde de la base cible est créée avant toute modification.

---

## 6. Fichiers à disposition

- **Rapport détaillé complet** (tous les enregistrements listés) :  
  `docs/RECAP_ANCIENNE_BASE_gesticomold.txt`  
- **Ce récapitulatif pour validation** :  
  `docs/RECAP_ANCIENNE_BASE_VALIDATION.md`

---

Le script de mise à jour est en place. Vous pouvez lancer la **mise à jour de la nouvelle base** (voir section 5) pour réinjecter ventes, achats, mouvements, dépenses et alimenter la comptabilité, puis vérifier les données dans GestiCom pour obtenir la **version définitive** pour la production.
