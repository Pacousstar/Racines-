/**
 * Diagnostic des bases GestiCom : compare les tables de prisma/gesticom.db,
 * GestiCom-Portable/data/gesticom.db et C:\gesticom_portable_data\gesticom.db (Windows).
 * À lancer depuis le dossier gesticom : node scripts/diagnostic-bd-portable.js
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const paths = [
  { name: 'Projet (prisma/gesticom.db)', path: path.join(projectRoot, 'prisma', 'gesticom.db') },
  { name: 'Portable (data/gesticom.db)', path: path.join(projectRoot, 'GestiCom-Portable', 'data', 'gesticom.db') },
]
if (process.platform === 'win32') {
  paths.push({ name: 'C:\\gesticom_portable_data (utilisée au runtime)', path: path.join('C:', 'gesticom_portable_data', 'gesticom.db') })
}

function getTables(dbPath) {
  if (!fs.existsSync(dbPath)) return null
  try {
    const Database = require('better-sqlite3')
    const db = new Database(dbPath, { readonly: true })
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
    db.close()
    return rows.map(r => r.name)
  } catch (e) {
    return { error: e.message }
  }
}

function countRows(dbPath, table) {
  if (!fs.existsSync(dbPath)) return null
  try {
    const Database = require('better-sqlite3')
    const db = new Database(dbPath, { readonly: true })
    const row = db.prepare('SELECT count(*) as n FROM ' + table).get()
    db.close()
    return row.n
  } catch (e) {
    return e.message
  }
}

console.log('=== Diagnostic des bases GestiCom ===\n')

for (const { name, path: dbPath } of paths) {
  const exists = fs.existsSync(dbPath)
  console.log(name)
  console.log('  Fichier:', dbPath)
  console.log('  Existe:', exists)
  if (exists) {
    const stat = fs.statSync(dbPath)
    console.log('  Taille:', Math.round(stat.size / 1024) + ' Ko')
    const tables = getTables(dbPath)
    if (Array.isArray(tables)) {
      console.log('  Tables:', tables.join(', '))
      const hasDepense = tables.includes('Depense')
      console.log('  Table Depense:', hasDepense ? 'OUI' : 'NON (manquante)')
      if (hasDepense) {
        const n = countRows(dbPath, 'Depense')
        console.log('  Enregistrements Depense:', n)
      }
      if (tables.includes('Vente')) console.log('  Enregistrements Vente:', countRows(dbPath, 'Vente'))
      if (tables.includes('Utilisateur')) console.log('  Enregistrements Utilisateur:', countRows(dbPath, 'Utilisateur'))
    } else if (tables && tables.error) {
      console.log('  Erreur lecture:', tables.error)
    }
  }
  console.log('')
}

const prismaPath = path.join(projectRoot, 'prisma', 'gesticom.db')
const portableDataPath = path.join(projectRoot, 'GestiCom-Portable', 'data', 'gesticom.db')
const prismaTables = getTables(prismaPath)
const portableTables = getTables(portableDataPath)

if (Array.isArray(prismaTables) && Array.isArray(portableTables)) {
  const depenseInPrisma = prismaTables.includes('Depense')
  const depenseInPortable = portableTables.includes('Depense')
  if (depenseInPrisma && !depenseInPortable) {
    console.log('>>> ACTION: La base du projet a la table Depense mais pas la base du portable.')
    console.log('    Exécutez: npm run portable:copy-db');
    console.log('    Puis arrêtez le portable et relancez Lancer.bat.\n');
  } else if (!depenseInPrisma) {
    console.log('>>> ACTION: La base du projet n\'a pas la table Depense (Prisma dit "already in sync").');
    console.log('    Exécutez: npm run portable:fix-depense');
    console.log('    Puis: npm run portable:copy-db');
    console.log('    Puis relancez le portable (Lancer.bat).\n');
  }
}

console.log('(Il n\'y a pas de table "dashboard" dans le schéma Prisma; le tableau de bord lit Vente, Depense, etc.)')
