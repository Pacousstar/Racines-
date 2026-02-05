/**
 * Active tous les produits (actif=1) et met à jour les quantités en stock
 * à partir de quantiteInitiale quand quantite = 0 (base restaurée).
 * À lancer depuis la racine : node scripts/activer-produits-et-stock.js
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '..')
const envPath = path.join(projectRoot, '.env')
let dbPath = path.join(projectRoot, 'prisma', 'gesticom.db')

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const m = content.match(/DATABASE_URL\s*=\s*["']?file:(.+?)["']?\s*$/m)
  if (m) {
    let p = m[1].trim().replace(/\?.*$/, '') // retirer ?busy_timeout=5000 etc.
    if (p.startsWith('./')) p = path.join(projectRoot, p.slice(2))
    else if (!path.isAbsolute(p)) p = path.join(projectRoot, p)
    dbPath = path.normalize(p)
  }
}

if (!fs.existsSync(dbPath)) {
  console.error('❌ Base introuvable:', dbPath)
  process.exit(1)
}

const Database = require('better-sqlite3')
const db = new Database(dbPath)

try {
  const r1 = db.prepare('UPDATE Produit SET actif = 1 WHERE actif = 0 OR actif IS NULL').run()
  console.log('✅ Produits activés (actif=1):', r1.changes, 'ligne(s)')

  const r2 = db.prepare('UPDATE Stock SET quantite = quantiteInitiale WHERE quantite = 0 OR quantite IS NULL').run()
  console.log('✅ Stock: quantite = quantiteInitiale pour', r2.changes, 'ligne(s)')

  const countStock = db.prepare('SELECT COUNT(*) as n FROM Stock WHERE quantite > 0').get()
  const countProduit = db.prepare('SELECT COUNT(*) as n FROM Produit WHERE actif = 1').get()
  console.log('📦 Lignes de stock avec quantite > 0:', countStock?.n ?? 0)
  console.log('📦 Produits actifs:', countProduit?.n ?? 0)
  console.log('')
  console.log('Redémarrez le serveur puis rechargez le dashboard.')
} finally {
  db.close()
}
