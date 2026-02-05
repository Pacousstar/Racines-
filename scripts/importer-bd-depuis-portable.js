/**
 * Importe la base du portable (GestiCom-Portable ou C:\gesticom_portable_data)
 * vers le projet (prisma/gesticom.db), puis met à jour le schéma.
 * Ainsi vous gardez toutes vos données (produits, stocks, etc.) ET vous utilisez
 * le projet à jour (menus Banque, etc.).
 *
 * À lancer depuis la racine : node scripts/importer-bd-depuis-portable.js
 * Puis : npm run db:fix-schema  et  npm run db:reset-admin
 * Enfin : npm run dev:legacy  (ou rebuild du portable avec npm run build:portable)
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '..')
const targetDb = path.join(projectRoot, 'prisma', 'gesticom.db')

// Emplacements possibles de la base portable (ordre de priorité)
const SOURCES_PORTABLE = [
  path.join(projectRoot, 'GestiCom-Portable', 'data', 'gesticom.db'),
  path.join('C:', 'gesticom_portable_data', 'gesticom.db'),
]

const sourceDb = SOURCES_PORTABLE.find((p) => fs.existsSync(p))
if (!sourceDb) {
  console.error('❌ Aucune base portable trouvée aux emplacements :')
  SOURCES_PORTABLE.forEach((p) => console.error('   -', p))
  console.error('')
  console.error('   Lancez une fois le portable (Lancer.bat) pour que la base soit créée,')
  console.error('   ou copiez votre fichier gesticom.db à la racine et lancez :')
  console.error('   node scripts/restaurer-bd.js gesticom.db')
  process.exit(1)
}

console.log('🔄 Import de la base portable vers le projet...')
console.log('📂 Source:', sourceDb)
console.log('📂 Destination: prisma/gesticom.db')

// Sauvegarde de l'actuelle base projet
if (fs.existsSync(targetDb)) {
  const backupName = `gesticom-backup-avant-import-portable-${Date.now()}.db`
  fs.copyFileSync(targetDb, path.join(projectRoot, backupName))
  console.log('💾 Base actuelle sauvegardée:', backupName)
}

fs.copyFileSync(sourceDb, targetDb)
console.log('✅ Base copiée.')

// Mise à jour du schéma (colonnes attendues par le projet à jour)
let Database
try {
  Database = require('better-sqlite3')
} catch (_) {
  console.log('Exécutez ensuite : npm run db:fix-schema')
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

  const tables = [
    ['Utilisateur', 'permissionsPersonnalisees', 'TEXT', null],
    ['Produit', 'updatedAt', 'TEXT', 'current_timestamp'],
    ['Stock', 'updatedAt', 'TEXT', 'current_timestamp'],
    ['Client', 'updatedAt', 'TEXT', 'current_timestamp'],
    ['Fournisseur', 'updatedAt', 'TEXT', 'current_timestamp'],
  ]
  let changed = false
  for (const [table, col, sqlType, def] of tables) {
    try {
      if (addColumn(table, col, sqlType, def)) {
        console.log('✅ Colonne', table + '.' + col, 'ajoutée.')
        changed = true
      }
    } catch (e) {
      console.warn('  (', table + '.' + col, ':', e.message, ')')
    }
  }
  if (!changed) console.log('✅ Schéma déjà à jour.')

  const countP = db.prepare('SELECT COUNT(*) as n FROM Produit').get()
  const countS = db.prepare('SELECT COUNT(*) as n FROM Stock').get()
  console.log('📦 Produits:', countP?.n ?? 0, '| Lignes de stock:', countS?.n ?? 0)
} finally {
  db.close()
}

console.log('')
console.log('Ensuite :')
console.log('  1. npm run db:reset-admin')
console.log('  2. npm run dev:legacy   (pour utiliser le projet avec tous les menus)')
console.log('')
console.log('Pour recréer un portable à jour avec cette base :')
console.log('  3. npm run build:portable   (le nouveau GestiCom-Portable aura Banque + vos données)')
