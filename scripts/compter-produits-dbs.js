/**
 * Compte les produits dans plusieurs bases (table Produit).
 * Usage: node scripts/compter-produits-dbs.js [fichier1.db] [fichier2.db] ...
 * Sans args: vérifie C:\gesticom\gesticom.db, prisma\gesticom.db, backups à la racine.
 */

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const projectRoot = path.resolve(__dirname, '..')

const defaultPaths = [
  'C:/gesticom/gesticom.db',
  path.join(projectRoot, 'prisma', 'gesticom.db'),
  path.join(projectRoot, 'docs', 'gesticomold.db'),
  path.join(projectRoot, 'GestiCom-Portable', 'data', 'gesticom.db'),
]

function countProduits(dbPath) {
  if (!fs.existsSync(dbPath)) return { path: dbPath, count: null, error: 'fichier absent' }
  try {
    const db = new Database(dbPath, { readonly: true })
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name='Produit' OR name='Product')").get()
    const tableName = table ? table.name : null
    if (!tableName) {
      db.close()
      return { path: dbPath, count: null, error: 'pas de table Produit/Product' }
    }
    const r = db.prepare(`SELECT COUNT(*) as n FROM ${tableName}`).get()
    db.close()
    return { path: dbPath, count: r.n, error: null }
  } catch (e) {
    return { path: dbPath, count: null, error: e.message }
  }
}

const files = process.argv.length > 2
  ? process.argv.slice(2).map((f) => (path.isAbsolute(f) ? f : path.resolve(projectRoot, f)))
  : defaultPaths

// Ajouter les backups à la racine
if (process.argv.length <= 2) {
  try {
    const rootFiles = fs.readdirSync(projectRoot).filter((f) => f.endsWith('.db'))
    rootFiles.forEach((f) => files.push(path.join(projectRoot, f)))
  } catch (_) {}
}

const seen = new Set()
const results = []
for (const p of files) {
  const norm = path.normalize(p)
  if (seen.has(norm)) continue
  seen.add(norm)
  results.push(countProduits(p))
}

console.log('Base | Produits | Erreur')
console.log('-----|---------|-------')
for (const r of results) {
  const short = path.relative(projectRoot, r.path) || r.path
  const count = r.count != null ? String(r.count) : '-'
  const err = r.error || ''
  console.log(short + ' | ' + count + ' | ' + err)
}

const with3885 = results.find((r) => r.count === 3885)
if (with3885) {
  console.log('\n=> Base avec 3885 produits:', with3885.path)
}
