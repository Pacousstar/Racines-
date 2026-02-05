# Prochaines étapes — Développement GestiCom

Feuille de route pour rendre GestiCom pleinement fonctionnel en production et en portable.

---

## État des priorités récentes (vérifié)

| Priorité | État | Détail |
|----------|------|--------|
| **Démarrage portable (chemins avec espaces)** | ✅ Fait | `portable-launcher.js` utilise `execFileSync(process.execPath, [ensureSchemaPath], { cwd: base })` — pas de shell, chemins avec espaces OK. |
| **Nouvelle vente — Reste à payer** | ✅ En place | Bloc « Paiement à crédit » affiche Total, Montant payé (avance), Reste à payer calculé en temps réel (`total - montantPaye`). |
| **Nouvelle vente — Popup ajout de lignes** | ✅ En place | Si enregistrement sans ligne : `setAddLignesPopupOpen(true)` ouvre la popup ; l’utilisateur ajoute des lignes puis « Valider et enregistrer la vente ». |
| **Logo / favicon** | ✅ En place | `layout.tsx` : favicon ; `DashboardLayoutClient`, `loading`, `page`, `login` : `/logo.png` (plusieurs dimensions). |
| **Nettoyage des sauvegardes** | ✅ En place | `build-portable.js` : `cleanupOldBackups` garde 2 sauvegardes par type ; `scripts/cleanup-backups.js` + `npm run portable:clean-backups`. |
| **Build (module xlsx)** | ✅ Corrigé | `tsconfig.json` exclut `GestiCom-Portable` pour éviter la compilation d’une copie avec l’ancien import. |

---

## Priorité haute (fonctionnel métier)

| # | Étape | Description |
|---|--------|-------------|
| 1 | **Exports PDF/Excel** | Exporter les listes (Ventes, Achats, Stock, Rapports, Comptabilité) en PDF et/ou Excel pour archivage et comptabilité. |
| 2 | **Impression tickets / bons** | Impression des tickets de vente, bons de livraison, bons d'achat (format A4 ou ticket). |
| 3 | **Sorties stock hors vente** | Gérer les sorties de stock non liées à une vente (casse, don, transfert entre magasins, correction). |
| 4 | **Inventaire stock** | Module ou écran pour faire un inventaire (saisie des quantités réelles, écart avec théorique, régularisation). |

---

## Priorité moyenne (robustesse et UX)

| # | Étape | Description |
|---|--------|-------------|
| 5 | **UI Charges** ✅ | Interface pour saisir et lister les charges (modèle Charge en base : type FIXE/VARIABLE, rubrique, montant). |
| 6 | **UI Caisse** ✅ | Interface pour les mouvements de caisse (entrées/sorties, motif, montant) — modèle Caisse déjà en base. |
| 7 | **Recherche globale** ✅ | Finaliser la recherche header (résultats produits, clients, fournisseurs, ventes) avec navigation claire. |
| 8 | **Gestion des erreurs** ✅ | Messages d'erreur explicites (API, formulaire), états de chargement cohérents, pas de page blanche. |
| 9 | **Sauvegardes base** ✅ | Bouton ou script pour sauvegarder/restaurer la base (export/import fichier .db ou dump). |

---

## Priorité basse (évolutions)

| # | Étape | Description |
|---|--------|-------------|
| 10 | **Multi-entité** | Sélecteur d'entité (si plusieurs Entite) pour filtrer magasins, ventes, achats par entité. |
| 11 | **PWA / hors-ligne** | Mode Progressive Web App pour usage partiel hors connexion (cache, sync au retour). |
| 12 | **Impression avancée** | Modèles d'impression personnalisables (en-tête, pied de page, logo entreprise). |
| 13 | **Statistiques avancées** | Graphiques (CA par période, évolution stock, top produits), tableaux de bord configurables. |
| 14 | **Audit / logs** | Traçabilité des modifications (qui a modifié quoi, quand) pour ventes, achats, stock. |

---

## Maintenance et qualité

| # | Étape | Description |
|---|--------|-------------|
| 15 | **Tests automatisés** | Tests unitaires et d'intégration (API, formulaires critiques) pour éviter les régressions. |
| 16 | **Documentation utilisateur** | Guide utilisateur (PDF ou intégré) : connexion, nouvelle vente, nouvel achat, rapports, portable. |
| 17 | **Sécurité** ✅ | Renforcer les rôles (COMPTABLE, AGENT), validation des entrées (Zod partout), audit des dépendances (npm audit). |

---

## Ordre suggéré pour la suite

1. **Exports PDF/Excel** (Ventes, Achats, Rapports) — besoin immédiat pour la comptabilité.
2. **Impression ticket / bon** — besoin terrain.
3. **Sorties stock hors vente** et **Inventaire** — compléter le cycle stock.
4. ~~**UI Caisse** puis **UI Charges**~~ — fait (boucler la trésorerie).
5. ~~**Recherche globale**~~ — fait. Puis **Sauvegardes**, **PWA** selon priorités métier.

Ce document peut être mis à jour au fil des livraisons (cocher les étapes réalisées, ajouter des sous-tâches).
