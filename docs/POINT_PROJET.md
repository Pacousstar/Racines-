# GestiCom — Point projet

## ✅ Où nous en sommes

### 1. Lisibilité des formulaires (corrigé)
- **globals.css** : `input`, `select`, `textarea` en `background-color: #ffffff !important` et `color: #111827 !important` ; `select option` idem ; placeholders `#6b7280 !important`. Priorité sur thèmes/composants pour éviter fond blanc sur blanc.
- **Blocs de formulaire** :  
  - `bg-orange-50` (Ventes, Produits, Clients, Fournisseurs)  
  - `bg-green-50` (Stock, entrée)  
  - `bg-gray-50` (Paramètres entreprise, Magasins, bloc Lignes Ventes)  
- **Modaux** : zone formulaire en `bg-gray-50` dans les modaux « Modifier le stock » et « Modifier le magasin » pour contraste avec les champs blancs.
- **Rapports / Comptabilité** : alertes `bg-red-50`, bannière mois `bg-amber-50` (fonds opaques).
→ Champs, listes déroulantes et options lisibles partout.

---

### 2. Pages créées et état

| Page | Rôle | État | Contenu |
|------|------|------|---------|
| **/** | Public | OK | Accueil, lien login |
| **/login** | Public | OK | Connexion (admin / Admin@123 après seed) |
| **/dashboard** | Connecté | OK | Stats (transactions, stock, mouvements, clients), ventes récentes, stock faible, répartition catégories, actions rapides |
| **/dashboard/produits** | Connecté | OK | Liste, recherche, Nouveau, Import JSON/CSV |
| **/dashboard/stock** | Connecté | OK | Filtre magasin, Entrée stock, Init stocks, tableau, édition qté / qté init., alertes seuil |
| **/dashboard/ventes** | Connecté | OK | Liste, Nouvelle vente (magasin, client/libre, paiement, **avance / reste à payer / crédit**), détail (modal), annuler |
| **/dashboard/clients** | Connecté | OK | Liste, recherche, Nouveau, modification (nom, tél., type CASH/CREDIT, plafond) |
| **/dashboard/fournisseurs** | Connecté | OK | Liste, recherche, Nouveau, modification |
| **/dashboard/rapports** | Connecté | OK | Alertes stock, top produits, mouvements ; **filtre période** (Du/Au, 7j, 30j, ce mois) |
| **/dashboard/comptabilite** | SUPER_ADMIN, COMPTABLE | OK | CA, ventes, clients ; **filtre mois/année** ; évolution vs mois précédent |
| **/dashboard/parametres** | SUPER_ADMIN, ADMIN | OK | Entreprise (nom, contact, localisation, devise, TVA), Magasins (CRUD, désactiver/réactiver) |
| **/dashboard/recherche** | Connecté | OK | Recherche globale (produits, clients, fournisseurs, ventes) ; accès via champ header (Entrée) |
| **/dashboard/achats** | Connecté | OK | Liste (filtre Du/Au), nouvel achat (magasin, fournisseur/libre, lignes, **avance / reste à payer / crédit**), détail ; entrées stock + mouvements |

---

### 3. Technique
- **Auth** : session (cookie), rôles SUPER_ADMIN, ADMIN, COMPTABLE, AGENT.
- **Base** : SQLite (`prisma/gesticom.db`), Prisma.
- **Standalone** : `npm run start:standalone` (launcher + base en `C:\Users\Public\gesticom\` si chemin avec espaces sous Windows).
- **Portable** : `npm run build:portable` → dossier GestiCom-Portable/ (clé USB). Base dans data/ ; repli vers C:\gesticom_portable_data si chemin avec espaces.
- **Import** : JSON et CSV (structure GestiCom_Produits_Master), création de stocks produit×magasin.
- **Paiements (avance / reste à payer / crédit)** : Ventes, Achats et Dépenses ont `montantPaye` et `statutPaiement` (PAYE, PARTIEL, CREDIT). Formulaires : champ « Montant payé (avance) », affichage « Reste à payer » ; listes : colonnes Statut paiement et Reste à payer. Pour une base existante : `npx prisma db push` puis une fois `node scripts/backfill-montant-paye.js` pour les anciens enregistrements.

---

## 📋 Ce qu’il reste à faire (priorités)

### Court terme
1. ~~**Recherche globale**~~ — **Fait** : formulaire header → `/dashboard/recherche?q=`, API `/api/recherche`, résultats par type.
2. ~~**Filtres dates**~~ — **Fait** : Rapports (Du/Au, 7j, 30j, ce mois, réinit.) ; Comptabilité (mois/année) ; Ventes (Du/Au, Filtrer, Réinit.).
3. **Exports** : PDF/Excel des rapports, ventes, stock (mentionné dans Comptabilité « À venir »).

### Moyen terme
4. ~~**Achats**~~ — **Fait** : liste (filtre dates), nouvel achat, détail d’UI.
5. **Charges** : schéma prêt (Charge) ; pas d’UI.
6. **Caisse** : schéma prêt (Caisse) ; pas d’UI.
7. **Mouvements de stock** : sorties (hors vente), inventaire, corrections.

### Plus tard
8. **Multi-entité** : Entite/Utilisateur/Magasin déjà en base ; sélecteur d’entité et filtres à brancher.
9. **Impression** : tickets de vente, bons de commande.
10. **Mode hors-ligne** : PWA / cache pour usage terrain.

---

## Résumé
- Formulaires et listes déroulantes : **corrigés** (fond, contraste, `!important`, modaux et fonds opaques).
- **13 pages** en place (dont Recherche, Achats). Module Achats opérationnel : liste, création, détail, entrées stock et mouvements automatiques.
- **À enchaîner** : exports PDF/Excel, puis Charges, Caisse et mouvements de stock (sorties, inventaire).
