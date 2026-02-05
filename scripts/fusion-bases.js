/**
 * Fusion des bases prisma/gesticom.db et prisma/prisma/gesticom.db :
 * - Sauvegarde des deux
 * - Base de travail = la plus grosse (prisma/prisma/gesticom.db) copiée vers prisma/gesticom.db
 * - prisma db push (schéma à jour)
 * - Fusion des Produit depuis l'autre base (dédoublonnage par code)
 * - prisma db seed (admin, Parametre si manquants)
 * - Suppression du dossier prisma/prisma
 *
 * Usage : npm run fusion-bases
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const projectRoot = path.join(__dirname, '..')
const prismaDir = path.join(projectRoot, 'prisma')
const mainDb = path.join(prismaDir, 'gesticom.db')
const nestedDb = path.join(prismaDir, 'prisma', 'gesticom.db')
const backupDir = path.join(prismaDir, 'backup_avant_fusion')

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: projectRoot, stdio: 'inherit', ...opts })
}

// 1) Sauvegardes
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
if (fs.existsSync(mainDb)) {
  fs.copyFileSync(mainDb, path.join(backupDir, 'gesticom.db'))
  console.log('Sauvegarde: prisma/gesticom.db -> prisma/backup_avant_fusion/gesticom.db')
}
if (fs.existsSync(nestedDb)) {
  fs.copyFileSync(nestedDb, path.join(backupDir, 'prisma_prisma_gesticom.db'))
  console.log('Sauvegarde: prisma/prisma/gesticom.db -> prisma/backup_avant_fusion/prisma_prisma_gesticom.db')
}

// 2) Base de travail : la plus grosse devient prisma/gesticom.db
const mainSize = fs.existsSync(mainDb) ? fs.statSync(mainDb).size : 0
const nestedSize = fs.existsSync(nestedDb) ? fs.statSync(nestedDb).size : 0

if (nestedSize >= mainSize && fs.existsSync(nestedDb)) {
  fs.copyFileSync(nestedDb, mainDb)
  console.log('Base de travail: prisma/prisma/gesticom.db copié vers prisma/gesticom.db (plus grosse)')
} else if (fs.existsSync(mainDb)) {
  console.log('Base de travail: prisma/gesticom.db conservée.')
}

// 3) Schéma à jour
console.log('Mise à jour du schéma (npx prisma db push)...')
run('npx prisma db push')

// 4) Fusion des Produit depuis l’autre base (dédoublonnage par code)
const smallBackup = path.join(backupDir, mainSize <= nestedSize ? 'gesticom.db' : 'prisma_prisma_gesticom.db')
if (fs.existsSync(smallBackup)) {
  try {
    const Database = require('better-sqlite3')
    const db = new Database(mainDb)
    const smallAbs = path.resolve(smallBackup).replace(/\\/g, '/').replace(/'/g, "''")
    db.exec(`ATTACH DATABASE '${smallAbs}' AS old`)
    try {
      db.exec(`
        INSERT OR IGNORE INTO main.Produit (code, designation, categorie, prixAchat, prixVente, seuilMin, actif)
        SELECT o.code, o.designation, COALESCE(o.categorie,'DIVERS'), o.prixAchat, o.prixVente, COALESCE(o.seuilMin,5), COALESCE(o.actif,1)
        FROM old.Produit o
        WHERE NOT EXISTS (SELECT 1 FROM main.Produit m WHERE m.code = o.code)
      `)
      const r = db.prepare('SELECT changes()').get()
      if (r && r['changes()'] > 0) console.log('Fusion: ' + r['changes()'] + ' produit(s) ajouté(s) depuis l’autre base.')
    } catch (e) {
      try {
        db.exec(`
          INSERT OR IGNORE INTO main.Produit (code, designation, categorie, prixAchat, prixVente, seuilMin, actif)
          SELECT o.code, o.designation, 'DIVERS', NULL, NULL, 5, 1
          FROM old.Produit o
          WHERE NOT EXISTS (SELECT 1 FROM main.Produit m WHERE m.code = o.code)
        `)
        const r = db.prepare('SELECT changes()').get()
        if (r && r['changes()'] > 0) console.log('Fusion: ' + r['changes()'] + ' produit(s) ajouté(s) depuis l’autre base (colonnes minimales).')
      } catch (e2) {
        console.warn('Fusion Produit ignorée (schéma différent):', e2.message)
      }
    }
    db.exec('DETACH DATABASE old')
    db.close()
  } catch (e) {
    console.warn('Fusion Produit (better-sqlite3) ignorée:', e.message)
  }
}

// 5) Données initiales (admin, Parametre)
console.log('Seed (npx prisma db seed)...')
run('npx prisma db seed')

// 6) Suppression de prisma/prisma
const nestedDir = path.join(prismaDir, 'prisma')
if (fs.existsSync(nestedDir)) {
  fs.rmSync(nestedDir, { recursive: true })
  console.log('Suppression: prisma/prisma/')
}

console.log('')
console.log('Fusion terminée. Base unique: prisma/gesticom.db')
console.log('Sauvegardes: prisma/backup_avant_fusion/')
console.log('Relancez: npm run start:standalone')
