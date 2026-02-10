/**
 * Mise à jour de la nouvelle base GestiCom à partir de l'ancienne base
 *
 * Règles appliquées :
 * - **Nomenclature unique** : correspondance des produits par code (exact puis normalisé :
 *   trim, majuscules, sans tirets/espaces). Si aucun produit cible ne correspond,
 *   le produit source est ajouté avec son code → un seul catalogue cohérent.
 * - **Stocks** : la nouvelle base conserve ses stocks initiaux ; seuls les **mouvements**
 *   de l’ancienne base sont répercutés (entrées/sorties) sur les stocks de la cible.
 * - **Comptabilité** : écritures comptables générées pour chaque vente, achat et
 *   dépense importés (plan de comptes et journaux créés si besoin).
 *
 * Usage :
 *   node scripts/mise-a-jour-depuis-ancienne-base.js [chemin-base-source] [chemin-base-cible]
 *
 * Par défaut :
 *   source = docs/gesticomold.db
 *   cible  = prisma/gesticom.db (ou DATABASE_URL si défini)
 */

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const projectRoot = path.resolve(__dirname, '..')

// Charger .env pour utiliser la même base que l'app (DATABASE_URL)
try {
  const envPath = path.join(projectRoot, '.env')
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8')
    env.split('\n').forEach((line) => {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/)
      if (m) process.env.DATABASE_URL = m[1].trim()
    })
  }
} catch (_) {}

const defaultSource = path.join(projectRoot, 'docs', 'gesticomold.db')
const defaultTarget = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/^file:/i, '').trim()
  : path.join(projectRoot, 'prisma', 'gesticom.db')

const sourceDbPath = path.resolve(projectRoot, process.argv[2] || defaultSource)
const targetDbPath = process.argv[3]
  ? (path.isAbsolute(process.argv[3]) ? path.resolve(process.argv[3]) : path.resolve(projectRoot, process.argv[3]))
  : (path.isAbsolute(defaultTarget) ? defaultTarget : path.resolve(projectRoot, defaultTarget))

if (!fs.existsSync(sourceDbPath)) {
  console.error(`Erreur: La base source n'existe pas: ${sourceDbPath}`)
  process.exit(1)
}
if (!fs.existsSync(targetDbPath)) {
  console.error(`Erreur: La base cible n'existe pas: ${targetDbPath}`)
  process.exit(1)
}

// Sauvegarde de la base cible
const backupPath = targetDbPath + '.backup-maj-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '.db'
fs.copyFileSync(targetDbPath, backupPath)
console.log(`✓ Sauvegarde créée: ${backupPath}`)

const targetDb = new Database(targetDbPath)
const sourceDbPathAbs = path.resolve(sourceDbPath).replace(/\\/g, '/').replace(/'/g, "''")
targetDb.exec(`ATTACH DATABASE '${sourceDbPathAbs}' AS source`)

const stats = {
  entites: 0,
  magasins: 0,
  produits: 0,
  clients: 0,
  fournisseurs: 0,
  utilisateurs: 0,
  planComptes: 0,
  journals: 0,
  mouvements: 0,
  stocksMisAJour: 0,
  ventes: 0,
  achats: 0,
  depenses: 0,
  ecritures: 0,
}

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

// Ids des opérations importées (pour génération des écritures)
const ventesImportees = []
const achatsImportes = []
const depensesImportees = []

/** Normalise un code pour la correspondance (une seule nomenclature) */
function normalizeCode(code) {
  if (code == null || typeof code !== 'string') return ''
  return String(code).trim().toUpperCase().replace(/-/g, '').replace(/\s+/g, '')
}

console.log('\n=== MISE À JOUR DEPUIS ANCIENNE BASE ===\n')
console.log(`Source: ${sourceDbPath}`)
console.log(`Cible:  ${targetDbPath}\n`)

// Utilisateur par défaut (ancienne base peut avoir 0 utilisateurs)
let defaultUtilisateurId = null
try {
  const firstUser = targetDb.prepare('SELECT id FROM main.Utilisateur WHERE actif = 1 LIMIT 1').get()
  if (firstUser) defaultUtilisateurId = firstUser.id
  else {
    const any = targetDb.prepare('SELECT id FROM main.Utilisateur LIMIT 1').get()
    if (any) defaultUtilisateurId = any.id
  }
  if (!defaultUtilisateurId) console.warn('   ⚠ Aucun utilisateur dans la cible : ventes/achats/mouvements/dépenses utiliseront un utilisateur à créer.')
} catch (e) {
  console.warn('   ⚠ Impossible de récupérer un utilisateur cible:', e.message)
}

// 1. Entités
console.log('1. Entités...')
try {
  const entites = targetDb.prepare('SELECT id, code FROM source.Entite').all()
  for (const entite of entites) {
    const existing = targetDb.prepare('SELECT id FROM main.Entite WHERE code = ?').get(entite.code)
    if (existing) {
      idMaps.entite[entite.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Entite (code, nom, type, localisation, active, createdAt, updatedAt)
        SELECT code, nom, type, localisation, active, createdAt, updatedAt FROM source.Entite WHERE id = ?
      `).run(entite.id)
      idMaps.entite[entite.id] = result.lastInsertRowid
      stats.entites++
    }
  }
  console.log(`   ✓ ${stats.entites} entité(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Entités: ${e.message}`)
}

// 2. Magasins
console.log('2. Magasins...')
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
        SELECT code, nom, localisation, ?, actif, createdAt, updatedAt FROM source.Magasin WHERE id = ?
      `).run(newEntiteId, magasin.id)
      idMaps.magasin[magasin.id] = result.lastInsertRowid
      stats.magasins++
    }
  }
  console.log(`   ✓ ${stats.magasins} magasin(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Magasins: ${e.message}`)
}

// 3. Produits — nomenclature unique : correspondance par code puis par code normalisé
console.log('3. Produits (nomenclature unique par code)...')
try {
  const targetProduits = targetDb.prepare('SELECT id, code FROM main.Produit').all()
  const byCode = {}
  const byNormalized = {}
  for (const p of targetProduits) {
    byCode[p.code] = p.id
    byNormalized[normalizeCode(p.code)] = p.id
  }

  const produits = targetDb.prepare('SELECT id, code, designation, categorie, prixAchat, prixVente, seuilMin, actif, createdAt, updatedAt FROM source.Produit').all()
  for (const produit of produits) {
    let newId = byCode[produit.code] ?? byNormalized[normalizeCode(produit.code)]
    if (newId != null) {
      idMaps.produit[produit.id] = newId
      continue
    }
    const result = targetDb.prepare(`
      INSERT INTO main.Produit (code, designation, categorie, prixAchat, prixVente, seuilMin, actif, createdAt, updatedAt)
      VALUES (?, ?, COALESCE(?, 'DIVERS'), ?, ?, COALESCE(?, 5), COALESCE(?, 1), ?, ?)
    `).run(
      produit.code,
      produit.designation,
      produit.categorie,
      produit.prixAchat,
      produit.prixVente,
      produit.seuilMin,
      produit.actif,
      produit.createdAt,
      produit.updatedAt
    )
    newId = result.lastInsertRowid
    idMaps.produit[produit.id] = newId
    byCode[produit.code] = newId
    byNormalized[normalizeCode(produit.code)] = newId
    stats.produits++
  }
  
  // Compter combien ont été trouvés vs ajoutés
  const totalSource = produits.length
  const trouves = totalSource - stats.produits
  if (trouves > 0) {
    console.log(`   ✓ ${stats.produits} produit(s) ajouté(s), ${trouves} trouvé(s) par correspondance de code`)
  } else {
    console.log(`   ✓ ${stats.produits} produit(s) ajouté(s) (tous étaient nouveaux)`)
  }
} catch (e) {
  console.warn(`   ⚠ Produits: ${e.message}`)
}

// 4. Clients
console.log('4. Clients...')
try {
  const clients = targetDb.prepare('SELECT id FROM source.Client').all()
  for (const client of clients) {
    const data = targetDb.prepare('SELECT nom, telephone, type, plafondCredit, ncc, actif, createdAt, updatedAt FROM source.Client WHERE id = ?').get(client.id)
    const existing = targetDb.prepare('SELECT id FROM main.Client WHERE nom = ? AND COALESCE(telephone, ?) = COALESCE(?, telephone)').get(data.nom, data.telephone || '', data.telephone || '')
    if (existing) {
      idMaps.client[client.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Client (nom, telephone, type, plafondCredit, ncc, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(data.nom, data.telephone, data.type, data.plafondCredit, data.ncc, data.actif ?? true, data.createdAt, data.updatedAt)
      idMaps.client[client.id] = result.lastInsertRowid
      stats.clients++
    }
  }
  console.log(`   ✓ ${stats.clients} client(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Clients: ${e.message}`)
}

// 5. Fournisseurs
console.log('5. Fournisseurs...')
try {
  const fournisseurs = targetDb.prepare('SELECT id FROM source.Fournisseur').all()
  for (const f of fournisseurs) {
    const data = targetDb.prepare('SELECT nom, telephone, email, ncc, actif, createdAt, updatedAt FROM source.Fournisseur WHERE id = ?').get(f.id)
    const existing = targetDb.prepare('SELECT id FROM main.Fournisseur WHERE nom = ? AND COALESCE(telephone, ?) = COALESCE(?, telephone)').get(data.nom, data.telephone || '', data.telephone || '')
    if (existing) {
      idMaps.fournisseur[f.id] = existing.id
    } else {
      const result = targetDb.prepare(`
        INSERT INTO main.Fournisseur (nom, telephone, email, ncc, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(data.nom, data.telephone, data.email, data.ncc, data.actif ?? true, data.createdAt, data.updatedAt)
      idMaps.fournisseur[f.id] = result.lastInsertRowid
      stats.fournisseurs++
    }
  }
  console.log(`   ✓ ${stats.fournisseurs} fournisseur(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Fournisseurs: ${e.message}`)
}

// 6. Utilisateurs
console.log('6. Utilisateurs...')
try {
  const utilisateurs = targetDb.prepare('SELECT id, login FROM source.Utilisateur').all()
  for (const u of utilisateurs) {
    const existing = targetDb.prepare('SELECT id FROM main.Utilisateur WHERE login = ?').get(u.login)
    if (existing) {
      idMaps.utilisateur[u.id] = existing.id
    } else {
      const userData = targetDb.prepare('SELECT nom, email, motDePasse, role, permissionsPersonnalisees, entiteId, actif, createdAt, updatedAt FROM source.Utilisateur WHERE id = ?').get(u.id)
      const newEntiteId = idMaps.entite[userData.entiteId] || userData.entiteId
      const result = targetDb.prepare(`
        INSERT INTO main.Utilisateur (login, nom, email, motDePasse, role, permissionsPersonnalisees, entiteId, actif, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userData.login,
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
      idMaps.utilisateur[u.id] = result.lastInsertRowid
      stats.utilisateurs++
    }
  }
  console.log(`   ✓ ${stats.utilisateurs} utilisateur(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Utilisateurs: ${e.message}`)
}

// 7. Plan de comptes et journaux (pour comptabilité)
console.log('7. Plan de comptes et journaux...')
function getOrCreatePlanCompte(numero, libelle, classe, type) {
  let r = targetDb.prepare('SELECT id FROM main.PlanCompte WHERE numero = ?').get(numero)
  if (r) return r.id
  targetDb.prepare(`
    INSERT INTO main.PlanCompte (numero, libelle, classe, type, actif, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `).run(numero, libelle, classe, type)
  stats.planComptes++
  return targetDb.prepare('SELECT id FROM main.PlanCompte WHERE numero = ?').get(numero).id
}
function getOrCreateJournal(code, libelle, type) {
  let r = targetDb.prepare('SELECT id FROM main.Journal WHERE code = ?').get(code)
  if (r) return r.id
  targetDb.prepare(`
    INSERT INTO main.Journal (code, libelle, type, actif, createdAt, updatedAt)
    VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
  `).run(code, libelle, type)
  stats.journals++
  return targetDb.prepare('SELECT id FROM main.Journal WHERE code = ?').get(code).id
}
try {
  getOrCreatePlanCompte('531', 'Caisse', '5', 'ACTIF')
  getOrCreatePlanCompte('701', 'Ventes de marchandises', '7', 'PRODUITS')
  getOrCreatePlanCompte('601', 'Achats de marchandises', '6', 'CHARGES')
  getOrCreatePlanCompte('401', 'Fournisseurs', '4', 'PASSIF')
  getOrCreatePlanCompte('658', 'Autres charges', '6', 'CHARGES')
  getOrCreateJournal('VE', 'Journal des Ventes', 'VENTES')
  getOrCreateJournal('AC', 'Journal des Achats', 'ACHATS')
  getOrCreateJournal('OD', 'Journal des Opérations Diverses', 'OD')
  console.log(`   ✓ Plan de comptes et journaux prêts`)
} catch (e) {
  console.warn(`   ⚠ Plan/Journaux: ${e.message}`)
}

// 8. Mouvements de stock + mise à jour des stocks (sans écraser les stocks initiaux)
console.log('8. Mouvements de stock et mise à jour des stocks...')
try {
  const mouvements = targetDb.prepare(`
    SELECT id, date, type, produitId, magasinId, entiteId, utilisateurId, quantite, observation, createdAt
    FROM source.Mouvement
  `).all()

  const nowIso = new Date().toISOString()
  for (const m of mouvements) {
    const newProduitId = idMaps.produit[m.produitId]
    const newMagasinId = idMaps.magasin[m.magasinId]
    const newEntiteId = idMaps.entite[m.entiteId] || m.entiteId
    const newUtilisateurId = idMaps.utilisateur[m.utilisateurId] || defaultUtilisateurId
    if (newProduitId == null || newMagasinId == null) continue
    if (newUtilisateurId == null) continue

    const existing = targetDb.prepare(`
      SELECT id FROM main.Mouvement WHERE date = ? AND produitId = ? AND magasinId = ? AND type = ? AND quantite = ?
    `).get(m.date, newProduitId, newMagasinId, m.type, m.quantite)
    if (existing) continue

    targetDb.prepare(`
      INSERT INTO main.Mouvement (date, type, produitId, magasinId, entiteId, utilisateurId, quantite, observation, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m.date, m.type, newProduitId, newMagasinId, newEntiteId, newUtilisateurId, m.quantite, m.observation, m.createdAt)
    stats.mouvements++

    // Appliquer le mouvement au stock (ne touche pas quantiteInitiale)
    const delta = m.type === 'ENTREE' ? m.quantite : -m.quantite
    let row = targetDb.prepare('SELECT id, quantite FROM main.Stock WHERE produitId = ? AND magasinId = ?').get(newProduitId, newMagasinId)
    if (row) {
      targetDb.prepare('UPDATE main.Stock SET quantite = quantite + ?, updatedAt = ? WHERE id = ?').run(delta, nowIso, row.id)
    } else {
      targetDb.prepare(`
        INSERT INTO main.Stock (produitId, magasinId, quantite, quantiteInitiale, createdAt, updatedAt)
        VALUES (?, ?, ?, 0, ?, ?)
      `).run(newProduitId, newMagasinId, Math.max(0, delta), nowIso, nowIso)
    }
    stats.stocksMisAJour++
  }
  console.log(`   ✓ ${stats.mouvements} mouvement(s) ajouté(s), ${stats.stocksMisAJour} stock(s) mis à jour`)
} catch (e) {
  console.warn(`   ⚠ Mouvements/Stocks: ${e.message}`)
}

// 9. Ventes + lignes
console.log('9. Ventes...')
try {
  const ventes = targetDb.prepare('SELECT id, numero FROM source.Vente').all()
  for (const vente of ventes) {
    if (targetDb.prepare('SELECT id FROM main.Vente WHERE numero = ?').get(vente.numero)) continue

    const venteData = targetDb.prepare(`
      SELECT date, magasinId, entiteId, utilisateurId, clientId, clientLibre, montantTotal,
             montantPaye, statutPaiement, modePaiement, statut, observation, createdAt
      FROM source.Vente WHERE id = ?
    `).get(vente.id)

    const newMagasinId = idMaps.magasin[venteData.magasinId] || venteData.magasinId
    const newEntiteId = idMaps.entite[venteData.entiteId] || venteData.entiteId
    const newUtilisateurId = idMaps.utilisateur[venteData.utilisateurId] || defaultUtilisateurId
    const newClientId = venteData.clientId ? (idMaps.client[venteData.clientId] || null) : null
    if (newUtilisateurId == null) continue

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
    ventesImportees.push({ id: newVenteId, numero: vente.numero, date: venteData.date, montantTotal: venteData.montantTotal, utilisateurId: newUtilisateurId })

    const lignes = targetDb.prepare('SELECT produitId, designation, quantite, prixUnitaire, montant FROM source.VenteLigne WHERE venteId = ?').all(vente.id)
    for (const ligne of lignes) {
      const newProduitId = idMaps.produit[ligne.produitId]
      if (newProduitId == null) continue
      targetDb.prepare(`
        INSERT INTO main.VenteLigne (venteId, produitId, designation, quantite, prixUnitaire, montant)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(newVenteId, newProduitId, ligne.designation, ligne.quantite, ligne.prixUnitaire, ligne.montant)
    }
    stats.ventes++
  }
  console.log(`   ✓ ${stats.ventes} vente(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Ventes: ${e.message}`)
}

// 10. Achats + lignes
console.log('10. Achats...')
try {
  const achats = targetDb.prepare('SELECT id, numero FROM source.Achat').all()
  for (const achat of achats) {
    if (targetDb.prepare('SELECT id FROM main.Achat WHERE numero = ?').get(achat.numero)) continue

    const achatData = targetDb.prepare(`
      SELECT date, magasinId, entiteId, utilisateurId, fournisseurId, fournisseurLibre,
             montantTotal, montantPaye, statutPaiement, modePaiement, observation, createdAt
      FROM source.Achat WHERE id = ?
    `).get(achat.id)

    const newMagasinId = idMaps.magasin[achatData.magasinId] || achatData.magasinId
    const newEntiteId = idMaps.entite[achatData.entiteId] || achatData.entiteId
    const newUtilisateurId = idMaps.utilisateur[achatData.utilisateurId] || defaultUtilisateurId
    const newFournisseurId = achatData.fournisseurId ? (idMaps.fournisseur[achatData.fournisseurId] || null) : null
    if (newUtilisateurId == null) continue

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
    achatsImportes.push({ id: newAchatId, numero: achat.numero, date: achatData.date, montantTotal: achatData.montantTotal, utilisateurId: newUtilisateurId })

    const lignes = targetDb.prepare('SELECT produitId, designation, quantite, prixUnitaire, montant FROM source.AchatLigne WHERE achatId = ?').all(achat.id)
    for (const ligne of lignes) {
      const newProduitId = idMaps.produit[ligne.produitId]
      if (newProduitId == null) continue
      targetDb.prepare(`
        INSERT INTO main.AchatLigne (achatId, produitId, designation, quantite, prixUnitaire, montant)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(newAchatId, newProduitId, ligne.designation, ligne.quantite, ligne.prixUnitaire, ligne.montant)
    }
    stats.achats++
  }
  console.log(`   ✓ ${stats.achats} achat(s) ajouté(s)`)
} catch (e) {
  console.warn(`   ⚠ Achats: ${e.message}`)
}

// 11. Dépenses
console.log('11. Dépenses...')
try {
  const depenses = targetDb.prepare(`
    SELECT date, magasinId, entiteId, utilisateurId, categorie, libelle, montant, montantPaye,
           statutPaiement, modePaiement, beneficiaire, pieceJustificative, observation, createdAt
    FROM source.Depense
  `).all()

  for (const depense of depenses) {
    const newMagasinId = depense.magasinId ? (idMaps.magasin[depense.magasinId] || depense.magasinId) : null
    const newEntiteId = idMaps.entite[depense.entiteId] || depense.entiteId
    const newUtilisateurId = idMaps.utilisateur[depense.utilisateurId] || defaultUtilisateurId
    if (newUtilisateurId == null) continue

    const existing = targetDb.prepare(`
      SELECT id FROM main.Depense WHERE date = ? AND COALESCE(magasinId, 0) = COALESCE(?, 0) AND categorie = ? AND libelle = ? AND montant = ?
    `).get(depense.date, newMagasinId, depense.categorie, depense.libelle, depense.montant)
    if (existing) continue

    const result = targetDb.prepare(`
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
    depensesImportees.push({ id: result.lastInsertRowid, date: depense.date, libelle: depense.libelle, montant: depense.montant, utilisateurId: newUtilisateurId })
    stats.depenses++
  }
  console.log(`   ✓ ${stats.depenses} dépense(s) ajoutée(s)`)
} catch (e) {
  console.warn(`   ⚠ Dépenses: ${e.message}`)
}

// 12. Écritures comptables (ventes, achats, dépenses importés)
console.log('12. Comptabilité — écritures pour opérations importées...')
try {
  const journalVE = getOrCreateJournal('VE', 'Journal des Ventes', 'VENTES')
  const journalAC = getOrCreateJournal('AC', 'Journal des Achats', 'ACHATS')
  const journalOD = getOrCreateJournal('OD', 'Journal des Opérations Diverses', 'OD')
  const compte531 = getOrCreatePlanCompte('531', 'Caisse', '5', 'ACTIF')
  const compte701 = getOrCreatePlanCompte('701', 'Ventes de marchandises', '7', 'PRODUITS')
  const compte601 = getOrCreatePlanCompte('601', 'Achats de marchandises', '6', 'CHARGES')
  const compte401 = getOrCreatePlanCompte('401', 'Fournisseurs', '4', 'PASSIF')
  const compte658 = getOrCreatePlanCompte('658', 'Autres charges', '6', 'CHARGES')

  function nextNumeroEcriture() {
    return 'ECR-IMP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9).toUpperCase()
  }

  for (const v of ventesImportees) {
    const num = nextNumeroEcriture()
    const dateStr = typeof v.date === 'string' ? v.date : new Date(v.date).toISOString()
    targetDb.prepare(`
      INSERT INTO main.EcritureComptable (numero, date, journalId, piece, libelle, compteId, debit, credit, reference, referenceType, referenceId, utilisateurId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'VENTE', ?, ?, datetime('now'))
    `).run(num, dateStr, journalVE, v.numero, 'Vente ' + v.numero, compte531, v.montantTotal, v.numero, v.id, v.utilisateurId)
    stats.ecritures++
    const num2 = nextNumeroEcriture()
    targetDb.prepare(`
      INSERT INTO main.EcritureComptable (numero, date, journalId, piece, libelle, compteId, debit, credit, reference, referenceType, referenceId, utilisateurId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'VENTE', ?, ?, datetime('now'))
    `).run(num2, dateStr, journalVE, v.numero, 'Vente ' + v.numero, compte701, v.montantTotal, v.numero, v.id, v.utilisateurId)
    stats.ecritures++
  }

  for (const a of achatsImportes) {
    const num = nextNumeroEcriture()
    const dateStr = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString()
    targetDb.prepare(`
      INSERT INTO main.EcritureComptable (numero, date, journalId, piece, libelle, compteId, debit, credit, reference, referenceType, referenceId, utilisateurId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'ACHAT', ?, ?, datetime('now'))
    `).run(num, dateStr, journalAC, a.numero, 'Achat ' + a.numero, compte601, a.montantTotal, a.numero, a.id, a.utilisateurId)
    stats.ecritures++
    const num2 = nextNumeroEcriture()
    targetDb.prepare(`
      INSERT INTO main.EcritureComptable (numero, date, journalId, piece, libelle, compteId, debit, credit, reference, referenceType, referenceId, utilisateurId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'ACHAT', ?, ?, datetime('now'))
    `).run(num2, dateStr, journalAC, a.numero, 'Achat ' + a.numero, compte531, a.montantTotal, a.numero, a.id, a.utilisateurId)
    stats.ecritures++
  }

  for (const d of depensesImportees) {
    const num = nextNumeroEcriture()
    const dateStr = typeof d.date === 'string' ? d.date : new Date(d.date).toISOString()
    targetDb.prepare(`
      INSERT INTO main.EcritureComptable (numero, date, journalId, piece, libelle, compteId, debit, credit, reference, referenceType, referenceId, utilisateurId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'DEPENSE', ?, ?, datetime('now'))
    `).run(num, dateStr, journalOD, null, d.libelle, compte658, d.montant, 'DEP-' + d.id, d.id, d.utilisateurId)
    stats.ecritures++
    const num2 = nextNumeroEcriture()
    targetDb.prepare(`
      INSERT INTO main.EcritureComptable (numero, date, journalId, piece, libelle, compteId, debit, credit, reference, referenceType, referenceId, utilisateurId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'DEPENSE', ?, ?, datetime('now'))
    `).run(num2, dateStr, journalOD, null, d.libelle, compte531, d.montant, 'DEP-' + d.id, d.id, d.utilisateurId)
    stats.ecritures++
  }

  console.log(`   ✓ ${stats.ecritures} écriture(s) comptable(s) créée(s)`)
} catch (e) {
  console.warn(`   ⚠ Écritures comptables: ${e.message}`)
}

targetDb.exec('DETACH DATABASE source')
targetDb.close()

console.log('\n=== RAPPORT ===\n')
console.log('Ajoutés / mis à jour:')
console.log(`  Entités: ${stats.entites} | Magasins: ${stats.magasins} | Produits: ${stats.produits}`)
console.log(`  Clients: ${stats.clients} | Fournisseurs: ${stats.fournisseurs} | Utilisateurs: ${stats.utilisateurs}`)
console.log(`  Mouvements: ${stats.mouvements} | Stocks mis à jour: ${stats.stocksMisAJour}`)
console.log(`  Ventes: ${stats.ventes} | Achats: ${stats.achats} | Dépenses: ${stats.depenses}`)
console.log(`  Écritures comptables: ${stats.ecritures}`)
console.log(`\n✓ Mise à jour terminée. Base cible: ${targetDbPath}`)
console.log(`✓ Sauvegarde: ${backupPath}`)
console.log('\n⚠ Vérifiez les données dans GestiCom avant de supprimer la sauvegarde.')
