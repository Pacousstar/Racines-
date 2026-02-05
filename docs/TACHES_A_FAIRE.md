# Liste des tâches à faire — Suite GestiCom

Document de référence pour la suite du développement GestiCom.  
Source : `POINT_PROJET.md` et `PROCHAINES_ETAPES.md`.

---

## Court terme

| # | Tâche | Détail |
|---|--------|--------|
| 1 | **Exports PDF/Excel** | Exporter les listes (Ventes, Achats, Stock, Rapports, Comptabilité) en PDF et/ou Excel pour archivage et comptabilité. Mentionné dans Comptabilité « À venir ». |

---

## Moyen terme (fonctionnel métier)

| # | Tâche | Détail |
|---|--------|--------|
| 2 | **Impression tickets / bons** | Tickets de vente, bons de livraison, bons d’achat (format A4 ou ticket). |
| 3 | **Charges** | Schéma prêt (modèle Charge) ; créer l’interface pour saisir et lister les charges (type FIXE/VARIABLE, rubrique, montant). |
| 4 | **Caisse** | Schéma prêt (modèle Caisse) ; créer l’interface pour les mouvements de caisse (entrées/sorties, motif, montant). |
| 5 | **Mouvements de stock** | Sorties hors vente (casse, don, transfert entre magasins, correction). |
| 6 | **Inventaire stock** | Module ou écran pour inventaire : saisie des quantités réelles, écart avec théorique, régularisation. |

---

## Plus tard (évolutions)

| # | Tâche | Détail |
|---|--------|--------|
| 7 | **Multi-entité** | Entite/Utilisateur/Magasin déjà en base ; sélecteur d’entité et filtres à brancher. |
| 8 | **Mode hors-ligne (PWA)** | Progressive Web App / cache pour usage terrain, sync au retour. |
| 9 | **Impression avancée** | Modèles personnalisables (en-tête, pied de page, logo entreprise). |
| 10 | **Statistiques avancées** | Graphiques (CA par période, évolution stock, top produits), tableaux de bord configurables. |
| 11 | **Audit / logs** | Traçabilité des modifications (qui a modifié quoi, quand) pour ventes, achats, stock. |

---

## Maintenance et qualité

| # | Tâche | Détail |
|---|--------|--------|
| 12 | **Tests automatisés** | Tests unitaires et d’intégration (API, formulaires critiques) pour éviter les régressions. |
| 13 | **Documentation utilisateur** | Guide utilisateur (PDF ou intégré) : connexion, nouvelle vente, nouvel achat, rapports, portable. |

---

## Ordre suggéré pour la suite

1. **Exports PDF/Excel** (Ventes, Achats, Rapports) — besoin immédiat pour la comptabilité.
2. **Impression ticket / bon** — besoin terrain.
3. **Sorties stock hors vente** et **Inventaire** — compléter le cycle stock.
4. **UI Caisse** puis **UI Charges** — boucler la trésorerie.
5. Puis **Multi-entité**, **PWA**, **Sauvegardes** selon priorités métier.

---

*Ce document peut être mis à jour au fil des livraisons (cocher les tâches réalisées, ajouter des sous-tâches).*
