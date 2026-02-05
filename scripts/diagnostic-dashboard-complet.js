/**
 * Diagnostic complet du dashboard : même requêtes que l'API, avec mesure du temps.
 * À lancer depuis la racine (serveur arrêté) : node scripts/diagnostic-dashboard-complet.js
 * Permet de voir quelle requête est lente ou échoue.
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '..')
const envPath = path.join(projectRoot, '.env')
let dbPath = path.join(projectRoot, 'prisma', 'gesticom.db')

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const m = content.match(/DATABASE_URL\s*=\s*["']?file:([^"'\s?]+)/)
  if (m) {
    let p = m[1].trim()
    if (p.startsWith('./')) p = path.join(projectRoot, p.slice(2))
    else if (!path.isAbsolute(p)) p = path.join(projectRoot, p)
    dbPath = path.normalize(p)
  }
}

console.log('=== DIAGNOSTIC DASHBOARD ===')
console.log('Base (d\'après .env):', dbPath)
console.log('Existe:', fs.existsSync(dbPath))
console.log('Taille (Ko):', fs.existsSync(dbPath) ? Math.round(fs.statSync(dbPath).size / 1024) : 0)
console.log('')

if (!fs.existsSync(dbPath)) {
  console.error('La base n\'existe pas. Lancez npm run db:import-portable ou restaurer-bd.js')
  process.exit(1)
}

// Prisma lit DATABASE_URL à l'import ; on le définit avant
if (!process.env.DATABASE_URL) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const m = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\s]+)/)
  let url = m ? m[1].trim() : 'file:./prisma/gesticom.db'
  if (!url.includes('busy_timeout')) url = url.replace(/\?.*$/, '') + (url.includes('?') ? '&' : '?') + 'busy_timeout=5000'
  process.env.DATABASE_URL = url
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function run(label, fn) {
  const start = Date.now()
  return Promise.resolve()
    .then(() => fn())
    .then((v) => {
      console.log(`  ${label}: ${JSON.stringify(v)} (${Date.now() - start} ms)`)
      return v
    })
    .catch((e) => {
      console.log(`  ${label}: ERREUR (${Date.now() - start} ms)`, e.message)
      throw e
    })
}

async function main() {
  const now = new Date()
  const debAuj = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const finAuj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  try {
    await run('produit.count', () => prisma.produit.count())
    await run('produit.count actif=true', () => prisma.produit.count({ where: { actif: true } }))
    await run('stock.count', () => prisma.stock.count())
    await run('stock.count quantite>0', () => prisma.stock.count({ where: { quantite: { gt: 0 } } }))
    await run('vente.count aujourd\'hui', () => prisma.vente.count({ where: { date: { gte: debAuj, lte: finAuj }, statut: 'VALIDEE' } }))
    await run('mouvement.count aujourd\'hui', () => prisma.mouvement.count({ where: { date: { gte: debAuj, lte: finAuj } } }))
    await run('Client actif=1 (raw)', () => prisma.$queryRaw`SELECT COUNT(*) as n FROM Client WHERE actif = 1`.then((r) => Number(r[0]?.n ?? 0)))
    await run('produit.groupBy categorie', () => prisma.produit.groupBy({ by: ['categorie'], where: { actif: true }, _count: { id: true } }))
    console.log('')
    console.log('Toutes les requêtes ont réussi. Si le dashboard affiche 0, les données sont à 0 (ex: actif=0, quantite=0).')
    console.log('Pour activer produits et remplir stock: npm run db:activer-produits-stock')
  } catch (e) {
    console.error('')
    console.error('Échec:', e.message)
    console.error('Vérifiez le schéma (colonnes manquantes): npm run db:fix-schema')
  } finally {
    await prisma.$disconnect()
  }
}

main()
