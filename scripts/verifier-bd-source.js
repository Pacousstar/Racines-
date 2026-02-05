/**
 * Vérifie que la base de données source contient les données importées
 */

const { PrismaClient } = require('@prisma/client')

process.env.DATABASE_URL = 'file:./prisma/gesticom.db'

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.produit.count()
    const withPrice = await prisma.produit.count({ where: { prixAchat: { gt: 0 } } })
    const withStock = await prisma.stock.count({ where: { quantite: { gt: 0 } } })
    
    const sample = await prisma.produit.findFirst({
      where: { prixAchat: { gt: 0 } },
      select: { code: true, designation: true, prixAchat: true, prixVente: true }
    })
    
    const stockSample = await prisma.stock.findFirst({
      where: { quantite: { gt: 0 } },
      select: { 
        quantite: true, 
        quantiteInitiale: true,
        produit: { select: { code: true, designation: true } },
        magasin: { select: { nom: true } }
      }
    })
    
    console.log('=== Vérification Base de Données SOURCE ===')
    console.log(`Total produits: ${count}`)
    console.log(`Produits avec prix d'achat > 0: ${withPrice}`)
    console.log(`Stocks avec quantité > 0: ${withStock}`)
    console.log('\nExemple produit avec prix:')
    console.log(JSON.stringify(sample, null, 2))
    console.log('\nExemple stock:')
    console.log(JSON.stringify(stockSample, null, 2))
    
    if (withPrice === 0 || withStock === 0) {
      console.log('\n⚠️  ATTENTION: La base source ne contient pas les données importées!')
      console.log('   Exécutez: node scripts/importer-nouvelle-bd.js')
    }
    
  } catch (e) {
    console.error('Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
