/**
 * Met à jour la base du portable : db push puis copie prisma/gesticom.db vers GestiCom-Portable/data/
 * À lancer depuis la racine du projet (dossier gesticom) : npm run portable:copy-db
 * Utile quand la table Depense (ou autre) manque dans le portable.
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const dbSrc = path.join(projectRoot, 'prisma', 'gesticom.db')
const outDir = path.join(projectRoot, 'GestiCom-Portable')
const dataDir = path.join(outDir, 'data')
const dbDest = path.join(dataDir, 'gesticom.db')

console.log('Mise à jour de la base du portable (db push + copie)...')
console.log('')

try {
  execSync('npx prisma db push', { cwd: projectRoot, stdio: 'inherit' })
} catch (e) {
  console.error('Erreur: prisma db push a échoué.')
  process.exit(1)
}

if (!fs.existsSync(dbSrc)) {
  console.error('Erreur: prisma/gesticom.db introuvable après db push.')
  process.exit(1)
}

if (!fs.existsSync(outDir)) {
  console.error('Erreur: dossier GestiCom-Portable introuvable. Lancez d\'abord: npm run build:portable')
  process.exit(1)
}

fs.mkdirSync(dataDir, { recursive: true })
fs.copyFileSync(dbSrc, dbDest)
const sizeKo = Math.round(fs.statSync(dbDest).size / 1024)
console.log('')
console.log('OK. Base copiée vers GestiCom-Portable/data/gesticom.db (' + sizeKo + ' Ko).')

// Vérifier que la table Depense existe dans la base copiée
try {
  const Database = require('better-sqlite3')
  const db = new Database(dbDest, { readonly: true })
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Depense'").get()
  db.close()
  if (!row) {
    console.error('')
    console.error('ERREUR: La table Depense est absente dans la base copiée.')
    console.error('  Vérifiez que prisma/gesticom.db a bien le schéma à jour:')
    console.error('  npx prisma db push')
    console.error('  Puis relancez: npm run portable:copy-db')
    process.exit(1)
  }
  console.log('  Vérification: table Depense présente.')
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('  (vérification Depense ignorée: better-sqlite3 non chargé)')
  } else {
    console.warn('  (vérification:', e.message + ')')
  }
}

console.log('')
console.log('Arrêtez le portable (fermez Lancer.bat), puis relancez Lancer.bat.')
console.log('Au démarrage, data/gesticom.db sera recopiée vers C:\\gesticom_portable_data.')
console.log('')
