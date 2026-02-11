/**
 * Met à jour le schéma SQLite pour être compatible avec le code.
 * Utilise prisma db push si disponible, sinon crée les tables manquantes via Prisma Client.
 * Utilisable depuis le projet (node scripts/ensure-schema.js) ou depuis GestiCom-Portable
 * au démarrage (launcher l'appelle avant server.js).
 * Lit DATABASE_URL depuis process.env, .database_url ou .env.
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const base = path.basename(__dirname) === 'scripts' ? path.join(__dirname, '..') : __dirname
const envPath = path.join(base, '.env')
const urlPath = path.join(base, '.database_url')
// Même source d'URL que le launcher / run-standalone : env (launcher) > LOCALAPPDATA > .database_url > .env
if (!process.env.DATABASE_URL && process.platform === 'win32' && process.env.LOCALAPPDATA) {
  try {
    const fixed = path.join(process.env.LOCALAPPDATA, 'GestiComPortable', 'database_url.txt')
    if (fs.existsSync(fixed)) process.env.DATABASE_URL = fs.readFileSync(fixed, 'utf8').trim()
  } catch (_) {}
}
if (!process.env.DATABASE_URL && fs.existsSync(urlPath)) {
  try {
    process.env.DATABASE_URL = fs.readFileSync(urlPath, 'utf8').trim()
  } catch (_) {}
}
if (!process.env.DATABASE_URL && fs.existsSync(envPath)) {
  try {
    const content = fs.readFileSync(envPath, 'utf8')
    const m = content.match(/DATABASE_URL\s*=\s*["']?([^"'\s]+)/)
    if (m) process.env.DATABASE_URL = m[1].trim()
  } catch (_) {}
}

if (!process.env.DATABASE_URL) {
  console.error('ensure-schema: DATABASE_URL manquant.')
  process.exit(1)
}

// Sous Windows, certains contextes SQLite acceptent mieux l'URL décodée (espaces réels au lieu de %20)
let dbUrl = process.env.DATABASE_URL.trim()
if (dbUrl.startsWith('file:')) {
  try {
    const decoded = 'file:' + decodeURIComponent(dbUrl.slice(5).replace(/^\/\//, ''))
    if (decoded !== dbUrl) dbUrl = decoded
  } catch (_) {}
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
})

async function tableExists(tableName) {
  const r = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'` 
  )
  return Array.isArray(r) && r.length > 0
}

async function main() {
  try {
    // Essayer d'abord avec prisma db push si disponible (dans le contexte du projet)
    const projectRoot = path.basename(__dirname) === 'scripts' ? path.join(__dirname, '..') : path.join(__dirname, '..')
    const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma')
    
    if (fs.existsSync(schemaPath)) {
      try {
        console.log('Synchronisation du schéma avec prisma db push...')
        execSync('npx prisma db push --accept-data-loss --skip-generate', {
          cwd: projectRoot,
          env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
          stdio: 'pipe',
        })
        console.log('Schéma BD synchronisé avec succès.')
        return
      } catch (e) {
        // Si prisma db push n'est pas disponible (contexte portable), créer les tables manquantes manuellement
        console.log('Prisma CLI non disponible, création des tables manquantes...')
      }
    }
    
    // Créer les tables manquantes via Prisma Client
    let changed = false
    
    // DashboardPreference
    if (!(await tableExists('DashboardPreference'))) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "DashboardPreference" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "utilisateurId" INTEGER NOT NULL UNIQUE,
          "widgets" TEXT,
          "periode" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE
        )
      `)
      console.log('  DashboardPreference: table créée')
      changed = true
    }
    
    // Vérifier et créer d'autres tables essentielles si nécessaire
    const essentialTables = [
      'Entite', 'Utilisateur', 'Magasin', 'Produit', 'Stock', 'Mouvement',
      'Client', 'Fournisseur', 'Vente', 'VenteLigne', 'Achat', 'AchatLigne',
      'Depense', 'Charge', 'Caisse', 'PlanCompte', 'Journal', 'EcritureComptable',
      'PrintTemplate'
    ]
    
    for (const table of essentialTables) {
      if (!(await tableExists(table))) {
        console.warn(`  Table ${table} manquante. Exécutez 'npx prisma db push' depuis le projet.`)
      }
    }
    
    if (changed) {
      console.log('Schéma BD mis à jour.')
    } else {
      console.log('Schéma BD déjà à jour.')
    }
  } catch (e) {
    console.error('ensure-schema:', e.message || e)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('ensure-schema:', e.message || e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
