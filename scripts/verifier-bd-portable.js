/**
 * Vérifie que la base de données portable contient les données importées
 */

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const dbPath = path.resolve(__dirname, '..', 'GestiCom-Portable', 'data', 'gesticom.db')
if (!fs.existsSync(dbPath)) {
  console.error(`Erreur: ${dbPath} n'existe pas`)
  process.exit(1)
}

// Utiliser un chemin absolu avec file://
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`
console.log('Base de données:', process.env.DATABASE_URL)

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.produit.count()
    const withPrice = await prisma.produit.count({ where: { prixAchat: { gt: 0 } } })
    const withStock = await prisma.stock.count({ where: { quantite: { gt: 0 } } })
    
    const sample = await prisma.produit.findFirst({
      select: { code: true, designation: true, prixAchat: true, prixVente: true }
    })
    
    const stockSample = await prisma.stock.findFirst({
      where: { quantite: { gt: 0 } },
      select: { 
        quantite: true, 
        produit: { select: { code: true, designation: true } },
        magasin: { select: { nom: true } }
      }
    })
    
    console.log('=== Vérification Base de Données Portable ===')
    console.log(`Total produits: ${count}`)
    console.log(`Produits avec prix d'achat > 0: ${withPrice}`)
    console.log(`Stocks avec quantité > 0: ${withStock}`)
    console.log('\nExemple produit:')
    console.log(JSON.stringify(sample, null, 2))
    console.log('\nExemple stock:')
    console.log(JSON.stringify(stockSample, null, 2))
    
    // Vérifier DashboardPreference
    const hasDashboardPref = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='DashboardPreference'`
    )
    console.log(`\nTable DashboardPreference existe: ${Array.isArray(hasDashboardPref) && hasDashboardPref.length > 0}`)
    
  } catch (e) {
    console.error('Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
