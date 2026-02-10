/**
 * Fusion des points de vente (magasins) :
 * - STK03 (20 produits) → STOCK03 (Stock 03) → 302 produits au total
 * - STK01 (2 produits) → STOCK01 (Stock 01) → 432 produits au total
 *
 * Le script transfère tous les stocks, mouvements, ventes, achats, etc. du magasin source
 * vers le magasin cible, puis désactive le magasin source.
 *
 * Usage: node scripts/fusion-magasins-stock.js [chemin-base]
 * Par défaut: DATABASE_URL ou prisma/gesticom.db
 */

const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

const projectRoot = path.resolve(__dirname, '..')
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

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/^file:/i, '').trim()
  : path.join(projectRoot, 'prisma', 'gesticom.db')

const targetPath = process.argv[2] ? (path.isAbsolute(process.argv[2]) ? process.argv[2] : path.resolve(projectRoot, process.argv[2])) : (path.isAbsolute(dbPath) ? dbPath : path.resolve(projectRoot, dbPath))

if (!fs.existsSync(targetPath)) {
  console.error('Base non trouvée:', targetPath)
  process.exit(1)
}

const db = new Database(targetPath)

// Récupérer les magasins
const magasins = db.prepare('SELECT id, code, nom FROM Magasin').all()
const byCode = {}
magasins.forEach((m) => { byCode[m.code] = m })

function countStocks(magasinId) {
  const r = db.prepare('SELECT COUNT(*) as c FROM Stock WHERE magasinId = ?').get(magasinId)
  return r.c
}

function runFusion(sourceCode, targetCode, expectedTotal) {
  const source = byCode[sourceCode]
  const target = byCode[targetCode]
  if (!source || !target) {
    console.warn(`  Ignoré: ${sourceCode} ou ${targetCode} introuvable.`)
    return
  }
  if (source.id === target.id) {
    console.warn(`  Ignoré: ${sourceCode} et ${targetCode} sont le même magasin.`)
    return
  }

  const countSource = countStocks(source.id)
  const countTarget = countStocks(target.id)
  console.log(`  ${sourceCode} (id=${source.id}) : ${countSource} lignes de stock`)
  console.log(`  ${targetCode} (id=${target.id}) : ${countTarget} lignes de stock`)

  // 1. Stock : fusionner par (produitId, magasinId) → ajouter les quantités vers le magasin cible
  const stocksSource = db.prepare('SELECT produitId, quantite, quantiteInitiale FROM Stock WHERE magasinId = ?').all(source.id)
  let stocksUpdated = 0
  let stocksInserted = 0
  for (const row of stocksSource) {
    const existing = db.prepare('SELECT id, quantite, quantiteInitiale FROM Stock WHERE produitId = ? AND magasinId = ?').get(row.produitId, target.id)
    if (existing) {
      db.prepare('UPDATE Stock SET quantite = quantite + ?, quantiteInitiale = quantiteInitiale + ?, updatedAt = ? WHERE id = ?')
        .run(row.quantite, row.quantiteInitiale, new Date().toISOString(), existing.id)
      stocksUpdated++
    } else {
      db.prepare('INSERT INTO Stock (produitId, magasinId, quantite, quantiteInitiale, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
        .run(row.produitId, target.id, row.quantite, row.quantiteInitiale, new Date().toISOString(), new Date().toISOString())
      stocksInserted++
    }
  }
  db.prepare('DELETE FROM Stock WHERE magasinId = ?').run(source.id)
  console.log(`  Stock: ${stocksUpdated} fusionnés, ${stocksInserted} créés, ancien magasin vidé.`)

  // 2. Mouvements
  const rMov = db.prepare('UPDATE Mouvement SET magasinId = ? WHERE magasinId = ?').run(target.id, source.id)
  console.log(`  Mouvements: ${rMov.changes} mis à jour.`)

  // 3. Ventes
  const rVente = db.prepare('UPDATE Vente SET magasinId = ? WHERE magasinId = ?').run(target.id, source.id)
  console.log(`  Ventes: ${rVente.changes} mises à jour.`)

  // 4. Achats
  const rAchat = db.prepare('UPDATE Achat SET magasinId = ? WHERE magasinId = ?').run(target.id, source.id)
  console.log(`  Achats: ${rAchat.changes} mis à jour.`)

  // 5. Dépenses (magasinId nullable)
  db.prepare('UPDATE Depense SET magasinId = ? WHERE magasinId = ?').run(target.id, source.id)
  // 6. Charges
  db.prepare('UPDATE Charge SET magasinId = ? WHERE magasinId = ?').run(target.id, source.id)
  // 7. Caisse
  db.prepare('UPDATE Caisse SET magasinId = ? WHERE magasinId = ?').run(target.id, source.id)

  // 8. Désactiver le magasin source
  db.prepare('UPDATE Magasin SET actif = 0, updatedAt = ? WHERE id = ?').run(new Date().toISOString(), source.id)
  console.log(`  Magasin ${sourceCode} désactivé.`)

  const totalAfter = countStocks(target.id)
  console.log(`  Total lignes de stock pour ${targetCode} après fusion: ${totalAfter}`)
  if (expectedTotal != null && totalAfter !== expectedTotal) {
    console.warn(`  ⚠ Attendu ${expectedTotal} produits (lignes de stock). Vérifiez.`)
  } else if (expectedTotal != null) {
    console.log(`  ✓ Cohérent avec le total attendu (${expectedTotal}).`)
  }
}

console.log('\n=== FUSION MAGASINS ===\n')
console.log('Base:', targetPath)

console.log('\n1. Fusion STK03 → STOCK03 (Stock 03), total attendu 302')
runFusion('STK03', 'STOCK03', 302)

console.log('\n2. Fusion STK01 → STOCK01 (Stock 01), total attendu 432')
runFusion('STK01', 'STOCK01', 432)

db.close()
console.log('\n✓ Terminé.\n')
