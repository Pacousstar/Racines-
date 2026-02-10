/**
 * Compte le nombre de produits dans une base SQLite.
 * Usage: node scripts/count-products-in-db.js <chemin-vers-gesticom.db>
 * Exemple: node scripts/count-products-in-db.js C:/gesticom/gesticom.db
 */

const path = require('path')
const { PrismaClient } = require('@prisma/client')

function main() {
  const dbPath = process.argv[2]
  if (!dbPath) {
    console.error('Usage: node count-products-in-db.js <chemin-gesticom.db>')
    process.exit(1)
  }
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)
  const url = 'file:' + absolutePath.replace(/\\/g, '/')
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  })
  prisma.product
    .count()
    .then((n) => {
      console.log(n)
      prisma.$disconnect()
    })
    .catch((e) => {
      console.error('Erreur:', e.message)
      prisma.$disconnect()
      process.exit(1)
    })
}

main()
