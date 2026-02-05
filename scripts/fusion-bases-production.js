/**
 * Script de fusion complète de bases de données GestiCom
 * 
 * Ce script fusionne les données d'une ancienne version (source) dans une nouvelle version (cible)
 * sans écraser les données existantes.
 * 
 * Usage:
 *   node scripts/fusion-bases-production.js <chemin-base-source> <chemin-base-cible>
 * 
 * Exemple:
 *   node scripts/fusion-bases-production.js "C:\GestiCom-Portable\data\gesticom.db" "GestiCom-Portable\data\gesticom.db"
 * 
 * Le script:
 * 1. Crée une sauvegarde de la base cible
 * 2. Fusionne les tables de référence (Entite, Magasin, Produit, Client, Fournisseur, etc.)
 * 3. Fusionne les transactions (Vente, Achat, Mouvement, Caisse, Charge, Depense)
 * 4. Fusionne les écritures comptables
 * 5. Met à jour les stocks
 * 6. Génère un rapport de fusion
 */

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// Arguments
const sourceDbPath = process.argv[2]
const targetDbPath = process.argv[3]

if (!sourceDbPath || !targetDbPath) {
  console.error('Usage: node fusion-bases-production.js <chemin-base-source> <chemin-base-cible>')
  console.error('Exemple: node fusion-bases-production.js "C:\\GestiCom-Portable\\data\\gesticom.db" "GestiCom-Portable\\data\\gesticom.db"')
  process.exit(1)
}

// Vérifier que les fichiers existent
if (!fs.existsSync(sourceDbPath)) {
  console.error(`Erreur: La base source n'existe pas: ${sourceDbPath}`)
  process.exit(1)
}

if (!fs.existsSync(targetDbPath)) {
  console.error(`Erreur: La base cible n'existe pas: ${targetDbPath}`)
  process.exit(1)
}

// Créer une sauvegarde de la base cible
const backupPath = targetDbPath + '.backup-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.db'
fs.copyFileSync(targetDbPath, backupPath)
console.log(`✓ Sauvegarde créée: ${backupPath}`)

// Ouvrir les bases de données
const targetDb = new Database(targetDbPath)
const sourceDbPathAbs = path.resolve(sourceDbPath).replace(/\\/g, '/').replace(/'/g, "''")

// Attacher la base source
targetDb.exec(`ATTACH DATABASE '${sourceDbPathAbs}' AS source`)

const stats = {
  entites: 0,
  magasins: 0,
  produits: 0,
  clients: 0,
  fournisseurs: 0,
  utilisateurs: 0,
  ventes: 0,
  achats: 0,
  mouvements: 0,
  caisse: 0,
  charges: 0,
  depenses: 0,
  ecritures: 0,
  stocks: 0,
  planComptes: 0,
  journals: 0,
}

// Mapping des IDs (ancien ID -> nouveau ID)
const idMaps = {
  entite: {},
  magasin: {},
  produit: {},
  client: {},
  fournisseur: {},
  utilisateur: {},
  planCompte: {},
  journal: {},
}

console.log('\n=== DÉBUT DE LA FUSION ===\n')

// 1. Fusion des Entités
console.log('1. Fusion des Entités...')
try {
  const entites = targetDb.prepare('SELECT id, code FROM source.Entite').all()
  for (const entite of entites) {
    const existing = targetDb.prepare('SELECT id FROM main.Entite WHERE code = ?').get(entite.code)
    if (existing) {
      idMaps.entite[entite.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Entite (code, nom, type, localisation, active, createdAt, updatedAt)
        SELECT code, nom, type, localisation, active, createdAt, updatedAt
        FROM source.Entite WHERE id = ?
      `).run(entite.id)
      idMaps.entite[entite.id] = result.lastInsertRowid
      stats.entites++
    }
  }
  console.log(`   ✓ ${stats.entites} entité(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Entités: ${e.message}`)
}

// 2. Fusion des Magasins
console.log('2. Fusion des Magasins...')
try {
  const magasins = targetDb.prepare('SELECT id, code, entiteId FROM source.Magasin').all()
  for (const magasin of magasins) {
    const newEntiteId = idMaps.entite[magasin.entiteId] || magasin.entiteId
    const existing = targetDb.prepare('SELECT id FROM main.Magasin WHERE code = ?').get(magasin.code)
    if (existing) {
      idMaps.magasin[magasin.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Magasin (code, nom, localisation, entiteId, actif, createdAt, updatedAt)
        SELECT code, nom, localisation, ?, actif, createdAt, updatedAt
        FROM source.Magasin WHERE id = ?
      `).run(newEntiteId, magasin.id)
      idMaps.magasin[magasin.id] = result.lastInsertRowid
      stats.magasins++
    }
  }
  console.log(`   ✓ ${stats.magasins} magasin(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Magasins: ${e.message}`)
}

// 3. Fusion des Produits
console.log('3. Fusion des Produits...')
try {
  const produits = targetDb.prepare('SELECT id, code FROM source.Produit').all()
  for (const produit of produits) {
    const existing = targetDb.prepare('SELECT id FROM main.Produit WHERE code = ?').get(produit.code)
    if (existing) {
      idMaps.produit[produit.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Produit (code, designation, categorie, prixAchat, prixVente, seuilMin, actif, createdAt, updatedAt)
        SELECT code, designation, COALESCE(categorie, 'DIVERS'), prixAchat, prixVente, COALESCE(seuilMin, 5), COALESCE(actif, 1), createdAt, updatedAt
        FROM source.Produit WHERE id = ?
      `).run(produit.id)
      idMaps.produit[produit.id] = result.lastInsertRowid
      stats.produits++
    }
  }
  console.log(`   ✓ ${stats.produits} produit(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Produits: ${e.message}`)
}

// 4. Fusion des Clients
console.log('4. Fusion des Clients...')
try {
  const clients = targetDb.prepare('SELECT id FROM source.Client').all()
  for (const client of clients) {
    const clientData = targetDb.prepare('SELECT nom, telephone, type, plafondCredit, ncc, actif, createdAt, updatedAt FROM source.Client WHERE id = ?').get(client.id)
    // Vérifier si un client avec le même nom existe déjà
    const existing = targetDb.prepare('SELECT id FROM main.Client WHERE nom = ? AND COALESCE(telephone, ?) = COALESCE(?, telephone)').get(clientData.nom, clientData.telephone || '', clientData.telephone || '')
    if (existing) {
      idMaps.client[client.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Client (nom, telephone, type, plafondCredit, ncc, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientData.nom,
        clientData.telephone,
        clientData.type,
        clientData.plafondCredit,
        clientData.ncc,
        clientData.actif ?? true,
        clientData.createdAt,
        clientData.updatedAt
      )
      idMaps.client[client.id] = result.lastInsertRowid
      stats.clients++
    }
  }
  console.log(`   ✓ ${stats.clients} client(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Clients: ${e.message}`)
}

// 5. Fusion des Fournisseurs
console.log('5. Fusion des Fournisseurs...')
try {
  const fournisseurs = targetDb.prepare('SELECT id FROM source.Fournisseur').all()
  for (const fournisseur of fournisseurs) {
    const fournisseurData = targetDb.prepare('SELECT nom, telephone, email, ncc, actif, createdAt, updatedAt FROM source.Fournisseur WHERE id = ?').get(fournisseur.id)
    const existing = targetDb.prepare('SELECT id FROM main.Fournisseur WHERE nom = ? AND COALESCE(telephone, ?) = COALESCE(?, telephone)').get(fournisseurData.nom, fournisseurData.telephone || '', fournisseurData.telephone || '')
    if (existing) {
      idMaps.fournisseur[fournisseur.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Fournisseur (nom, telephone, email, ncc, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        fournisseurData.nom,
        fournisseurData.telephone,
        fournisseurData.email,
        fournisseurData.ncc,
        fournisseurData.actif ?? true,
        fournisseurData.createdAt,
        fournisseurData.updatedAt
      )
      idMaps.fournisseur[fournisseur.id] = result.lastInsertRowid
      stats.fournisseurs++
    }
  }
  console.log(`   ✓ ${stats.fournisseurs} fournisseur(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Fournisseurs: ${e.message}`)
}

// 6. Fusion des Utilisateurs
console.log('6. Fusion des Utilisateurs...')
try {
  const utilisateurs = targetDb.prepare('SELECT id, login FROM source.Utilisateur').all()
  for (const utilisateur of utilisateurs) {
    const existing = targetDb.prepare('SELECT id FROM main.Utilisateur WHERE login = ?').get(utilisateur.login)
    if (existing) {
      idMaps.utilisateur[utilisateur.id] = existing.id
    } else {
      const userData = targetDb.prepare('SELECT nom, email, motDePasse, role, permissionsPersonnalisees, entiteId, actif, createdAt, updatedAt FROM source.Utilisateur WHERE id = ?').get(utilisateur.id)
      const newEntiteId = idMaps.entite[userData.entiteId] || userData.entiteId
      const result = targetDb.prepare(`
        INSERT INTO main.Utilisateur (login, nom, email, motDePasse, role, permissionsPersonnalisees, entiteId, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        utilisateur.login,
        userData.nom,
        userData.email,
        userData.motDePasse,
        userData.role,
        userData.permissionsPersonnalisees,
        newEntiteId,
        userData.actif ?? true,
        userData.createdAt,
        userData.updatedAt
      )
      idMaps.utilisateur[utilisateur.id] = result.lastInsertRowid
      stats.utilisateurs++
    }
  }
  console.log(`   ✓ ${stats.utilisateurs} utilisateur(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Utilisateurs: ${e.message}`)
}

// 7. Fusion du Plan de Comptes
console.log('7. Fusion du Plan de Comptes...')
try {
  const comptes = targetDb.prepare('SELECT id, numero FROM source.PlanCompte').all()
  for (const compte of comptes) {
    const existing = targetDb.prepare('SELECT id FROM main.PlanCompte WHERE numero = ?').get(compte.numero)
    if (existing) {
      idMaps.planCompte[compte.id] = existing.id
    } else {
      const compteData = targetDb.prepare('SELECT libelle, classe, type, actif, createdAt, updatedAt FROM source.PlanCompte WHERE id = ?').get(compte.id)
      const result = targetDb.prepare(`
        INSERT INTO main.PlanCompte (numero, libelle, classe, type, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        compte.numero,
        compteData.libelle,
        compteData.classe,
        compteData.type,
        compteData.actif ?? true,
        compteData.createdAt,
        compteData.updatedAt
      )
      idMaps.planCompte[compte.id] = result.lastInsertRowid
      stats.planComptes++
    }
  }
  console.log(`   ✓ ${stats.planComptes} compte(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion du Plan de Comptes: ${e.message}`)
}

// 8. Fusion des Journaux
console.log('8. Fusion des Journaux...')
try {
  const journaux = targetDb.prepare('SELECT id, code FROM source.Journal').all()
  for (const journal of journaux) {
    const existing = targetDb.prepare('SELECT id FROM main.Journal WHERE code = ?').get(journal.code)
    if (existing) {
      idMaps.journal[journal.id] = existing.id
    } else {
      const journalData = targetDb.prepare('SELECT libelle, type, actif, createdAt, updatedAt FROM source.Journal WHERE id = ?').get(journal.id)
      const result = targetDb.prepare(`
        INSERT INTO main.Journal (code, libelle, type, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        journal.code,
        journalData.libelle,
        journalData.type,
        journalData.actif ?? true,
        journalData.createdAt,
        journalData.updatedAt
      )
      idMaps.journal[journal.id] = result.lastInsertRowid
      stats.journals++
    }
  }
  console.log(`   ✓ ${stats.journals} journal(aux) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Journaux: ${e.message}`)
}

// 9. Fusion des Mouvements de Stock
console.log('9. Fusion des Mouvements de Stock...')
try {
  const mouvements = targetDb.prepare(`
    SELECT id, date, type, produitId, magasinId, entiteId, utilisateurId, quantite, observation, createdAt
    FROM source.Mouvement
  `).all()
  
  for (const mouvement of mouvements) {
    const newProduitId = idMaps.produit[mouvement.produitId] || mouvement.produitId
    const newMagasinId = idMaps.magasin[mouvement.magasinId] || mouvement.magasinId
    const newEntiteId = idMaps.entite[mouvement.entiteId] || mouvement.entiteId
    const newUtilisateurId = idMaps.utilisateur[mouvement.utilisateurId] || mouvement.utilisateurId
    
    // Vérifier si le mouvement existe déjà (même date, produit, magasin, type, quantite)
    const existing = targetDb.prepare(`
      SELECT id FROM main.Mouvement 
      WHERE date = ? AND produitId = ? AND magasinId = ? AND type = ? AND quantite = ?
    `).get(mouvement.date, newProduitId, newMagasinId, mouvement.type, mouvement.quantite)
    
    if (!existing) {
      targetDb.prepare(`
        INSERT INTO main.Mouvement (date, type, produitId, magasinId, entiteId, utilisateurId, quantite, observation, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mouvement.date,
        mouvement.type,
        newProduitId,
        newMagasinId,
        newEntiteId,
        newUtilisateurId,
        mouvement.quantite,
        mouvement.observation,
        mouvement.createdAt
      )
      stats.mouvements++
    }
  }
  console.log(`   ✓ ${stats.mouvements} mouvement(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Mouvements: ${e.message}`)
}

// 10. Fusion des Stocks
console.log('10. Fusion des Stocks...')
try {
  const stocks = targetDb.prepare('SELECT produitId, magasinId, quantite, quantiteInitiale, createdAt, updatedAt FROM source.Stock').all()
  
  for (const stock of stocks) {
    const newProduitId = idMaps.produit[stock.produitId] || stock.produitId
    const newMagasinId = idMaps.magasin[stock.magasinId] || stock.magasinId
    
    const existing = targetDb.prepare('SELECT id, quantite FROM main.Stock WHERE produitId = ? AND magasinId = ?').get(newProduitId, newMagasinId)
    
    if (existing) {
      // Fusionner les quantités (additionner)
      targetDb.prepare(`
        UPDATE main.Stock 
        SET quantite = quantite + ?, updatedAt = ?
        WHERE id = ?
      `).run(stock.quantite, stock.updatedAt, existing.id)
      stats.stocks++
    } else {
      targetDb.prepare(`
        INSERT INTO main.Stock (produitId, magasinId, quantite, quantiteInitiale, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        newProduitId,
        newMagasinId,
        stock.quantite,
        stock.quantiteInitiale,
        stock.createdAt,
        stock.updatedAt
      )
      stats.stocks++
    }
  }
  console.log(`   ✓ ${stats.stocks} stock(s) fusionné(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Stocks: ${e.message}`)
}

// 11. Fusion des Ventes
console.log('11. Fusion des Ventes...')
try {
  const ventes = targetDb.prepare('SELECT id, numero FROM source.Vente').all()
  
  for (const vente of ventes) {
    // Vérifier si la vente existe déjà (par numéro)
    const existing = targetDb.prepare('SELECT id FROM main.Vente WHERE numero = ?').get(vente.numero)
    if (existing) {
      continue // Vente déjà présente
    }
    
    const venteData = targetDb.prepare(`
      SELECT date, magasinId, entiteId, utilisateurId, clientId, clientLibre, montantTotal, 
             montantPaye, statutPaiement, modePaiement, statut, observation, createdAt
      FROM source.Vente WHERE id = ?
    `).get(vente.id)
    
    const newMagasinId = idMaps.magasin[venteData.magasinId] || venteData.magasinId
    const newEntiteId = idMaps.entite[venteData.entiteId] || venteData.entiteId
    const newUtilisateurId = idMaps.utilisateur[venteData.utilisateurId] || venteData.utilisateurId
    const newClientId = venteData.clientId ? (idMaps.client[venteData.clientId] || venteData.clientId) : null
    
    const result = targetDb.prepare(`
      INSERT INTO main.Vente (numero, date, magasinId, entiteId, utilisateurId, clientId, clientLibre, 
                               montantTotal, montantPaye, statutPaiement, modePaiement, statut, observation, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vente.numero,
      venteData.date,
      newMagasinId,
      newEntiteId,
      newUtilisateurId,
      newClientId,
      venteData.clientLibre,
      venteData.montantTotal,
      venteData.montantPaye,
      venteData.statutPaiement,
      venteData.modePaiement,
      venteData.statut,
      venteData.observation,
      venteData.createdAt
    )
    
    const newVenteId = result.lastInsertRowid
    
    // Fusionner les lignes de vente
    const lignes = targetDb.prepare('SELECT produitId, designation, quantite, prixUnitaire, montant FROM source.VenteLigne WHERE venteId = ?').all(vente.id)
    for (const ligne of lignes) {
      const newProduitId = idMaps.produit[ligne.produitId] || ligne.produitId
      targetDb.prepare(`
        INSERT INTO main.VenteLigne (venteId, produitId, designation, quantite, prixUnitaire, montant)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(newVenteId, newProduitId, ligne.designation, ligne.quantite, ligne.prixUnitaire, ligne.montant)
    }
    
    stats.ventes++
  }
  console.log(`   ✓ ${stats.ventes} vente(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Ventes: ${e.message}`)
}

// 12. Fusion des Achats
console.log('12. Fusion des Achats...')
try {
  const achats = targetDb.prepare('SELECT id, numero FROM source.Achat').all()
  
  for (const achat of achats) {
    const existing = targetDb.prepare('SELECT id FROM main.Achat WHERE numero = ?').get(achat.numero)
    if (existing) {
      continue
    }
    
    const achatData = targetDb.prepare(`
      SELECT date, magasinId, entiteId, utilisateurId, fournisseurId, fournisseurLibre, 
             montantTotal, montantPaye, statutPaiement, modePaiement, observation, createdAt
      FROM source.Achat WHERE id = ?
    `).get(achat.id)
    
    const newMagasinId = idMaps.magasin[achatData.magasinId] || achatData.magasinId
    const newEntiteId = idMaps.entite[achatData.entiteId] || achatData.entiteId
    const newUtilisateurId = idMaps.utilisateur[achatData.utilisateurId] || achatData.utilisateurId
    const newFournisseurId = achatData.fournisseurId ? (idMaps.fournisseur[achatData.fournisseurId] || achatData.fournisseurId) : null
    
    const result = targetDb.prepare(`
      INSERT INTO main.Achat (numero, date, magasinId, entiteId, utilisateurId, fournisseurId, fournisseurLibre,
                              montantTotal, montantPaye, statutPaiement, modePaiement, observation, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      achat.numero,
      achatData.date,
      newMagasinId,
      newEntiteId,
      newUtilisateurId,
      newFournisseurId,
      achatData.fournisseurLibre,
      achatData.montantTotal,
      achatData.montantPaye,
      achatData.statutPaiement,
      achatData.modePaiement,
      achatData.observation,
      achatData.createdAt
    )
    
    const newAchatId = result.lastInsertRowid
    
    // Fusionner les lignes d'achat
    const lignes = targetDb.prepare('SELECT produitId, designation, quantite, prixUnitaire, montant FROM source.AchatLigne WHERE achatId = ?').all(achat.id)
    for (const ligne of lignes) {
      const newProduitId = idMaps.produit[ligne.produitId] || ligne.produitId
      targetDb.prepare(`
        INSERT INTO main.AchatLigne (achatId, produitId, designation, quantite, prixUnitaire, montant)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(newAchatId, newProduitId, ligne.designation, ligne.quantite, ligne.prixUnitaire, ligne.montant)
    }
    
    stats.achats++
  }
  console.log(`   ✓ ${stats.achats} achat(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Achats: ${e.message}`)
}

// 13. Fusion des Opérations de Caisse
console.log('13. Fusion des Opérations de Caisse...')
try {
  const caisseOps = targetDb.prepare(`
    SELECT date, magasinId, type, motif, montant, utilisateurId, createdAt
    FROM source.Caisse
  `).all()
  
  for (const op of caisseOps) {
    const newMagasinId = idMaps.magasin[op.magasinId] || op.magasinId
    const newUtilisateurId = idMaps.utilisateur[op.utilisateurId] || op.utilisateurId
    
    // Vérifier si l'opération existe déjà
    const existing = targetDb.prepare(`
      SELECT id FROM main.Caisse 
      WHERE date = ? AND magasinId = ? AND type = ? AND montant = ? AND motif = ?
    `).get(op.date, newMagasinId, op.type, op.montant, op.motif)
    
    if (!existing) {
      targetDb.prepare(`
        INSERT INTO main.Caisse (date, magasinId, type, motif, montant, utilisateurId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(op.date, newMagasinId, op.type, op.motif, op.montant, newUtilisateurId, op.createdAt)
      stats.caisse++
    }
  }
  console.log(`   ✓ ${stats.caisse} opération(s) de caisse ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Opérations de Caisse: ${e.message}`)
}

// 14. Fusion des Charges
console.log('14. Fusion des Charges...')
try {
  const charges = targetDb.prepare(`
    SELECT date, magasinId, entiteId, utilisateurId, type, rubrique, montant, observation, createdAt
    FROM source.Charge
  `).all()
  
  for (const charge of charges) {
    const newMagasinId = charge.magasinId ? (idMaps.magasin[charge.magasinId] || charge.magasinId) : null
    const newEntiteId = idMaps.entite[charge.entiteId] || charge.entiteId
    const newUtilisateurId = idMaps.utilisateur[charge.utilisateurId] || charge.utilisateurId
    
    // Vérifier si la charge existe déjà
    const existing = targetDb.prepare(`
      SELECT id FROM main.Charge 
      WHERE date = ? AND COALESCE(magasinId, 0) = COALESCE(?, 0) AND type = ? AND rubrique = ? AND montant = ?
    `).get(charge.date, newMagasinId, charge.type, charge.rubrique, charge.montant)
    
    if (!existing) {
      targetDb.prepare(`
        INSERT INTO main.Charge (date, magasinId, entiteId, utilisateurId, type, rubrique, montant, observation, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        charge.date,
        newMagasinId,
        newEntiteId,
        newUtilisateurId,
        charge.type,
        charge.rubrique,
        charge.montant,
        charge.observation,
        charge.createdAt
      )
      stats.charges++
    }
  }
  console.log(`   ✓ ${stats.charges} charge(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Charges: ${e.message}`)
}

// 15. Fusion des Dépenses
console.log('15. Fusion des Dépenses...')
try {
  const depenses = targetDb.prepare(`
    SELECT date, magasinId, entiteId, utilisateurId, categorie, libelle, montant, montantPaye,
           statutPaiement, modePaiement, beneficiaire, pieceJustificative, observation, createdAt
    FROM source.Depense
  `).all()
  
  for (const depense of depenses) {
    const newMagasinId = depense.magasinId ? (idMaps.magasin[depense.magasinId] || depense.magasinId) : null
    const newEntiteId = idMaps.entite[depense.entiteId] || depense.entiteId
    const newUtilisateurId = idMaps.utilisateur[depense.utilisateurId] || depense.utilisateurId
    
    // Vérifier si la dépense existe déjà
    const existing = targetDb.prepare(`
      SELECT id FROM main.Depense 
      WHERE date = ? AND COALESCE(magasinId, 0) = COALESCE(?, 0) AND categorie = ? AND libelle = ? AND montant = ?
    `).get(depense.date, newMagasinId, depense.categorie, depense.libelle, depense.montant)
    
    if (!existing) {
      targetDb.prepare(`
        INSERT INTO main.Depense (date, magasinId, entiteId, utilisateurId, categorie, libelle, montant, montantPaye,
                                  statutPaiement, modePaiement, beneficiaire, pieceJustificative, observation, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        depense.date,
        newMagasinId,
        newEntiteId,
        newUtilisateurId,
        depense.categorie,
        depense.libelle,
        depense.montant,
        depense.montantPaye,
        depense.statutPaiement,
        depense.modePaiement,
        depense.beneficiaire,
        depense.pieceJustificative,
        depense.observation,
        depense.createdAt
      )
      stats.depenses++
    }
  }
  console.log(`   ✓ ${stats.depenses} dépense(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Dépenses: ${e.message}`)
}

// 16. Fusion des Écritures Comptables
console.log('16. Fusion des Écritures Comptables...')
try {
  const ecritures = targetDb.prepare('SELECT id, numero FROM source.EcritureComptable').all()
  
  for (const ecriture of ecritures) {
    const existing = targetDb.prepare('SELECT id FROM main.EcritureComptable WHERE numero = ?').get(ecriture.numero)
    if (existing) {
      continue
    }
    
    const ecritureData = targetDb.prepare(`
      SELECT date, journalId, piece, libelle, compteId, debit, credit, reference, referenceType, referenceId,
             utilisateurId, createdAt
      FROM source.EcritureComptable WHERE id = ?
    `).get(ecriture.id)
    
    const newJournalId = idMaps.journal[ecritureData.journalId] || ecritureData.journalId
    const newCompteId = idMaps.planCompte[ecritureData.compteId] || ecritureData.compteId
    const newUtilisateurId = idMaps.utilisateur[ecritureData.utilisateurId] || ecritureData.utilisateurId
    
    targetDb.prepare(`
      INSERT INTO main.EcritureComptable (numero, date, journalId, piece, libelle, compteId, debit, credit,
                                          reference, referenceType, referenceId, utilisateurId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ecriture.numero,
      ecritureData.date,
      newJournalId,
      ecritureData.piece,
      ecritureData.libelle,
      newCompteId,
      ecritureData.debit,
      ecritureData.credit,
      ecritureData.reference,
      ecritureData.referenceType,
      ecritureData.referenceId,
      newUtilisateurId,
      ecritureData.createdAt
    )
    
    stats.ecritures++
  }
  console.log(`   ✓ ${stats.ecritures} écriture(s) comptable(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Erreur lors de la fusion des Écritures Comptables: ${e.message}`)
}

// Détacher la base source
targetDb.exec('DETACH DATABASE source')
targetDb.close()

// Afficher le rapport
console.log('\n=== RAPPORT DE FUSION ===\n')
console.log('Éléments ajoutés/fusionnés:')
console.log(`  - Entités: ${stats.entites}`)
console.log(`  - Magasins: ${stats.magasins}`)
console.log(`  - Produits: ${stats.produits}`)
console.log(`  - Clients: ${stats.clients}`)
console.log(`  - Fournisseurs: ${stats.fournisseurs}`)
console.log(`  - Utilisateurs: ${stats.utilisateurs}`)
console.log(`  - Plan de Comptes: ${stats.planComptes}`)
console.log(`  - Journaux: ${stats.journals}`)
console.log(`  - Mouvements: ${stats.mouvements}`)
console.log(`  - Stocks: ${stats.stocks}`)
console.log(`  - Ventes: ${stats.ventes}`)
console.log(`  - Achats: ${stats.achats}`)
console.log(`  - Opérations de Caisse: ${stats.caisse}`)
console.log(`  - Charges: ${stats.charges}`)
console.log(`  - Dépenses: ${stats.depenses}`)
console.log(`  - Écritures Comptables: ${stats.ecritures}`)

console.log(`\n✓ Fusion terminée avec succès!`)
console.log(`✓ Base cible mise à jour: ${targetDbPath}`)
console.log(`✓ Sauvegarde disponible: ${backupPath}`)
console.log('\n⚠ IMPORTANT: Vérifiez les données dans GestiCom avant de supprimer la sauvegarde!')
