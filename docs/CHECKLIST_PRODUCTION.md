# Checklist « Production prête » – GestiCom

À valider avant de considérer la production (et le build portable) comme opérationnels.

## 1. Configuration

- [ok] **`.env`** : `DATABASE_URL` pointe vers la base de production (ex. `file:C:/gesticom/gesticom.db`).
- [ok] **`.env`** : `SESSION_SECRET` présent et d’au moins **32 caractères** (sinon la connexion peut échouer en prod ; le portable utilise un secret par défaut si absent).
- [ok] Base de production à jour (produits, stocks, paramètres) avant chaque `npm run build:portable`.

## 2. Connexion et sécurité

- [ ] Connexion possible avec un utilisateur existant (login / mot de passe).
- [ ] Déconnexion fonctionne.
- [ ] Les utilisateurs non SUPER_ADMIN ne voient que les données de leur entité (ventes, achats, exports, détail, annulation).

## 3. Achats

- [ ] **Liste** : pagination, filtres dates, affichage des lignes.
- [ ] **Création** : choix magasin, fournisseur (ou libre), lignes produits (quantité, prix), mode de paiement, montant payé → enregistrement OK, stock mis à jour, écriture compta si activée.
- [ ] **Détail** : ouverture d’un achat par id, infos complètes.
- [ ] **Export** : Excel et PDF limités aux données de l’entité (hors SUPER_ADMIN).

## 4. Ventes

- [ ] **Liste** : pagination, filtres dates, affichage des lignes.
- [ ] **Création** : magasin, client (ou libre), lignes, mode de paiement, crédit si besoin (client type CREDIT, plafond) → enregistrement OK, stock décrémenté, écriture compta si activée.
- [ ] **Détail** : ouverture d’une vente par id, infos complètes.
- [ ] **Impression facture** : toutes les lignes sur une même facture.
- [ ] **Annulation** : annulation d’une vente → stock recrémenté, statut ANNULEE.
- [ ] **Export** : Excel et PDF limités aux données de l’entité (hors SUPER_ADMIN).

## 5. Comptabilité

- [ ] Écritures visibles (page Écritures, option « Toutes les dates » si besoin).
- [ ] Backfill ventes/achats/dépenses/charges OK si utilisé.
- [ ] Aucune erreur bloquante au chargement des écritures.

## 6. Build portable

- [ ] **Préparation** : fermer toute instance qui utilise la base (Lancer.bat du portable, `npm run dev` / `npm run start`).
- [ ] **Commande** : `npm run build:portable` à la racine du projet.
- [ ] **Résultat** : dossier **GestiCom-Portable** créé avec `data/gesticom.db` (copie de `C:\gesticom\gesticom.db` si elle existe, sinon `prisma/gesticom.db`).
- [ ] **Utilisation** : copier le dossier sur clé/autre PC, ajouter `node.exe`, lancer **Lancer.bat** (ou Lancer.vbs).
- [ ] **Portable** : connexion OK, Achats et Ventes opérationnels (création, liste, détail, export), pas d’erreur SESSION_SECRET en console.

## 7. Après validation

Une fois tous les points ci‑dessus validés :

- La **production** (serveur avec base `C:\gesticom\gesticom.db` et `npm run start`) peut démarrer directement.
- Le **portable** peut être distribué ; il part avec la base à jour intégrée au build (voir `docs/CONVENTION_BASE_PORTABLE.md` et `docs/CONSEILS_PERFORMANCE_ET_BUILD_PORTABLE.md`).

---

*Dernière mise à jour : vérification des APIs Achats/Ventes (création, liste, détail, export, annulation), filtrage par entité, build portable et config production.*
