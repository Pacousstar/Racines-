/**
 * Script pour restaurer la base de données depuis une sauvegarde.
 * Base du 04/02/2026 : backup-portable-data-202602040524.db ou 202602040517.db
 *
 * Usage:
 *   node scripts/restaurer-bd.js                    → tente les emplacements connus du 04/02/2026
 *   node scripts/restaurer-bd.js chemin/vers/ma.db  → restaure depuis ce fichier
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const targetDb = path.join(projectRoot, 'prisma', 'gesticom.db')

// Emplacements possibles pour la base du 04/02/2026 (ordre de tentative)
const SOURCES_04_02_2026 = [
  path.join(projectRoot, 'backup-portable-data-202602040524.db'),
  path.join(projectRoot, 'backup-portable-data-202602040517.db'),
  path.join(projectRoot, 'docs', 'gesticom_production.db'),
]

let sourceDb
const arg = process.argv[2]
if (arg) {
  sourceDb = path.isAbsolute(arg) ? arg : path.resolve(projectRoot, arg)
} else {
  sourceDb = SOURCES_04_02_2026.find((p) => fs.existsSync(p))
  if (!sourceDb) {
    console.error('❌ Aucune base du 04/02/2026 trouvée aux emplacements suivants :')
    SOURCES_04_02_2026.forEach((p) => console.error('   -', p))
    console.error('')
    console.error('   Soit placez un de ces fichiers dans la racine du projet,')
    console.error('   soit lancez : node scripts/restaurer-bd.js chemin/vers/votre-fichier.db')
    process.exit(1)
  }
}

console.log('🔄 Restauration de la base de données...')
console.log(`📂 Source: ${sourceDb}`)
console.log(`📂 Destination: ${targetDb}`)

if (!fs.existsSync(sourceDb)) {
  console.error(`❌ Erreur: Le fichier source n'existe pas: ${sourceDb}`)
  process.exit(1)
}

try {
  // Sauvegarder la base actuelle avant restauration
  const backupName = `gesticom-backup-avant-restauration-${Date.now()}.db`
  const backupPath = path.resolve(__dirname, '..', backupName)
  
  if (fs.existsSync(targetDb)) {
    console.log(`💾 Sauvegarde de la base actuelle vers: ${backupName}`)
    fs.copyFileSync(targetDb, backupPath)
    console.log(`✅ Sauvegarde créée: ${backupName}`)
  }

  // Copier la sauvegarde vers la base actuelle
  console.log('📋 Copie de la sauvegarde...')
  fs.copyFileSync(sourceDb, targetDb)
  
  console.log('✅ Base de données restaurée avec succès!')
  console.log(`📊 Source utilisée: ${path.basename(sourceDb)}`)

  // Vérifier le nombre de produits
  try {
    const Database = require('better-sqlite3')
    const db = new Database(targetDb)
    const count = db.prepare('SELECT COUNT(*) as count FROM Produit WHERE actif = 1').get()
    console.log(`📦 Nombre de produits actifs: ${count.count}`)
    db.close()
  } catch (_) {
    console.log('(Vérification Produit ignorée)')
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la restauration:', error.message)
  process.exit(1)
}
