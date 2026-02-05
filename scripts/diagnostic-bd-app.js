/**
 * Diagnostic : contenu de la base utilisée par l'app (même chemin que .env).
 * À lancer depuis la racine : node scripts/diagnostic-bd-app.js
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

console.log('📂 Base utilisée par l\'app (d\'après .env):', dbPath)
console.log('   Existe:', fs.existsSync(dbPath) ? 'oui' : 'non')
if (!fs.existsSync(dbPath)) {
  console.log('❌ Le fichier n\'existe pas. Restaurez avec: node scripts/restaurer-bd.js')
  process.exit(1)
}

let Database
try {
  Database = require('better-sqlite3')
} catch (e) {
  console.log('❌ better-sqlite3 requis. Lancez: npm install')
  process.exit(1)
}

const db = new Database(dbPath)
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Produit','Stock','produit','stock')").all()
  const tableNames = tables.map((r) => r.name)
  let countProduit = 0
  let countStock = 0
  const produitTable = tableNames.find((t) => t.toLowerCase() === 'produit')
  const stockTable = tableNames.find((t) => t.toLowerCase() === 'stock')
  if (produitTable) {
    const r = db.prepare(`SELECT COUNT(*) as n FROM ${produitTable}`).get()
    countProduit = r?.n ?? 0
  }
  if (stockTable) {
    const r = db.prepare(`SELECT COUNT(*) as n FROM ${stockTable}`).get()
    countStock = r?.n ?? 0
  }
  console.log('📦 Produits (table Produit):', countProduit)
  console.log('📦 Lignes de stock (table Stock):', countStock)

  // Colonnes attendues par Prisma (schema actuel)
  const produitCols = db.prepare("SELECT name FROM pragma_table_info('Produit')").all().map((r) => r.name)
  const stockCols = db.prepare("SELECT name FROM pragma_table_info('Stock')").all().map((r) => r.name)
  const needProduit = ['updatedAt'].filter((c) => !produitCols.includes(c))
  const needStock = ['updatedAt'].filter((c) => !stockCols.includes(c))
  if (needProduit.length || needStock.length) {
    console.log('')
    console.log('⚠️  Colonnes manquantes (schéma Prisma vs base):')
    if (needProduit.length) console.log('   Produit:', needProduit.join(', '))
    if (needStock.length) console.log('   Stock:', needStock.join(', '))
    console.log('')
    console.log('   Ajoutez-les avec: node scripts/ajouter-colonnes-manquantes-bd.js')
  }

  if (countProduit === 0 && countStock === 0) {
    console.log('')
    console.log('⚠️  La base est vide. Restaurez la base du 04/02/2026 :')
    console.log('    1. Arrêtez le serveur (Ctrl+C)')
    console.log('    2. node scripts/restaurer-bd.js')
    console.log('    3. npm run db:reset-admin')
    console.log('    4. npm run dev:legacy')
  }
} finally {
  db.close()
}
