/**
 * Utilise la base récente (04/02/2026) : restaure puis met à jour le schéma si besoin.
 * À lancer avec le serveur arrêté : node scripts/utiliser-base-recente.js
 * Puis : npm run db:reset-admin && npm run dev:legacy
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const targetDb = path.join(projectRoot, 'prisma', 'gesticom.db')

const SOURCES = [
  path.join(projectRoot, 'backup-portable-data-202602040524.db'),
  path.join(projectRoot, 'backup-portable-data-202602040517.db'),
  path.join(projectRoot, 'docs', 'gesticom_production.db'),
]

const sourceDb = SOURCES.find((p) => fs.existsSync(p))
if (!sourceDb) {
  console.error('❌ Aucune base récente trouvée. Placez backup-portable-data-202602040524.db à la racine.')
  process.exit(1)
}

console.log('🔄 Utilisation de la base récente...')
console.log('📂 Source:', path.basename(sourceDb))

if (fs.existsSync(targetDb)) {
  const backupName = `gesticom-backup-avant-restauration-${Date.now()}.db`
  fs.copyFileSync(targetDb, path.join(projectRoot, backupName))
  console.log('💾 Ancienne base sauvegardée:', backupName)
}

fs.copyFileSync(sourceDb, targetDb)
console.log('✅ Base restaurée vers prisma/gesticom.db')

// Mise à jour du schéma (colonnes manquantes)
let Database
try {
  Database = require('better-sqlite3')
} catch (_) {
  console.log('(Schéma : exécutez npm run db:fix-schema si besoin)')
  process.exit(0)
}

const db = new Database(targetDb)
try {
  function hasColumn(table, col) {
    return db.prepare('SELECT name FROM pragma_table_info(?) WHERE name = ?').all(table, col).length > 0
  }
  function addColumn(table, col, sqlType, def) {
    if (hasColumn(table, col)) return false
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${sqlType}${def ? ' DEFAULT ' + def : ''}`).run()
    return true
  }

  let changed = false
  if (addColumn('Produit', 'updatedAt', 'TEXT', 'current_timestamp')) {
    console.log('✅ Colonne Produit.updatedAt ajoutée.')
    changed = true
  }
  if (addColumn('Stock', 'updatedAt', 'TEXT', 'current_timestamp')) {
    console.log('✅ Colonne Stock.updatedAt ajoutée.')
    changed = true
  }
  if (addColumn('Client', 'updatedAt', 'TEXT', 'current_timestamp')) {
    console.log('✅ Colonne Client.updatedAt ajoutée.')
    changed = true
  }
  if (addColumn('Fournisseur', 'updatedAt', 'TEXT', 'current_timestamp')) {
    console.log('✅ Colonne Fournisseur.updatedAt ajoutée.')
    changed = true
  }
  if (!changed) console.log('✅ Schéma déjà à jour.')

  const r = db.prepare('SELECT COUNT(*) as n FROM Produit').get()
  console.log('📦 Produits dans la base:', r?.n ?? 0)
} finally {
  db.close()
}

console.log('')
console.log('Ensuite : npm run db:reset-admin  puis  npm run dev:legacy')
console.log('(Connexion : admin / Admin@123)')
