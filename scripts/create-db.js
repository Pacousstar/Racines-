const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Forcer la création de la base en faisant une requête simple
  await prisma.$connect()
  // Faire une requête qui ne fait rien si la table n'existe pas
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (e) {
    // Ignorer les erreurs
  }
  console.log('Base de données créée/connectée')
  await prisma.$disconnect()
}

main().catch(console.error)
