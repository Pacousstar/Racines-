/**
 * Script pour sauvegarder la base de données avant l'import
 * Crée une sauvegarde avec timestamp
 */

const path = require('path')
const fs = require('fs')

// Charger DATABASE_URL
const envPath = path.join(__dirname, '..', '.env')
const urlPath = path.join(__dirname, '..', '.database_url')

if (fs.existsSync(urlPath)) {
  process.env.DATABASE_URL = fs.readFileSync(urlPath, 'utf8').trim()
} else if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const m = content.match(/DATABASE_URL\s*=\s*["']?([^"'\s]+)/)
  if (m) process.env.DATABASE_URL = m[1].trim()
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant. Définissez-le dans .env ou .database_url.')
  process.exit(1)
}

// Extraire le chemin de la base de données
const dbUrl = process.env.DATABASE_URL
let dbPath = dbUrl.replace(/^file:/, '').replace(/^\/\//, '')

// Si c'est un chemin relatif, le rendre absolu
if (!path.isAbsolute(dbPath)) {
  dbPath = path.join(__dirname, '..', dbPath)
}

// Normaliser le chemin (supprimer les espaces et caractères spéciaux)
dbPath = path.normalize(dbPath)

console.log('💾 SAUVEGARDE DE LA BASE DE DONNÉES')
console.log('='.repeat(80))
console.log('')

if (!fs.existsSync(dbPath)) {
  console.error(`❌ Base de données introuvable : ${dbPath}`)
  console.error('   La base sera créée lors du premier import.')
  process.exit(0)
}

// Créer le dossier de sauvegarde
const backupDir = path.join(__dirname, '..', 'backups')
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
  console.log(`✓ Dossier de sauvegarde créé : ${backupDir}`)
}

// Générer le nom de la sauvegarde avec timestamp
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
const dbName = path.basename(dbPath, path.extname(dbPath))
const backupPath = path.join(backupDir, `${dbName}-backup-${timestamp}${path.extname(dbPath)}`)

try {
  // Copier la base de données
  fs.copyFileSync(dbPath, backupPath)
  
  const stats = fs.statSync(backupPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  
  console.log(`✓ Sauvegarde créée avec succès !`)
  console.log(`  Fichier : ${backupPath}`)
  console.log(`  Taille : ${sizeMB} MB`)
  console.log(`  Date : ${new Date().toLocaleString('fr-FR')}`)
  console.log('')
  console.log('📝 Pour restaurer cette sauvegarde :')
  console.log(`   cp "${backupPath}" "${dbPath}"`)
  console.log('')
  
} catch (error) {
  console.error('❌ Erreur lors de la sauvegarde :', error.message)
  process.exit(1)
}
