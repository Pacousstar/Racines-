/**
 * Vérifie la base de données portable après build
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, '..', 'GestiCom-Portable', 'data', 'gesticom.db')

if (!fs.existsSync(dbPath)) {
  console.error('❌ Base portable non trouvée:', dbPath)
  process.exit(1)
}

process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📊 VÉRIFICATION DE LA BASE PORTABLE')
    console.log('='.repeat(80))
    console.log(`📁 Chemin: ${dbPath}`)
    console.log('')
    
    const produits = await prisma.produit.count()
    const stocks = await prisma.stock.count()
    
    // Vérifier les produits avec plusieurs magasins
    const stocksParProduit = await prisma.stock.groupBy({
      by: ['produitId'],
      _count: { id: true }
    })
    const produitsMultiples = stocksParProduit.filter(s => s._count.id > 1).length
    
    console.log(`📦 Produits : ${produits}`)
    console.log(`📦 Stocks : ${stocks}`)
    console.log(`📦 Produits avec plusieurs magasins : ${produitsMultiples}`)
    console.log('')
    
    if (produits === stocks && produitsMultiples === 0) {
      console.log('✅ BASE PORTABLE CORRECTE')
      console.log('   - Nombre de produits = Nombre de stocks (1:1)')
      console.log('   - Aucun produit avec plusieurs magasins')
      console.log('')
    } else {
      console.log('❌ PROBLÈME DÉTECTÉ')
      if (produits !== stocks) {
        console.log(`   - Différence produits/stocks : ${Math.abs(produits - stocks)}`)
      }
      if (produitsMultiples > 0) {
        console.log(`   - ${produitsMultiples} produit(s) avec plusieurs magasins`)
      }
      console.log('')
    }
    
    // Statistiques supplémentaires
    const stocksAvecQte = await prisma.stock.count({
      where: { quantite: { gt: 0 } }
    })
    const produitsAvecStock = await prisma.stock.findMany({
      where: { quantite: { gt: 0 } },
      select: { produitId: true },
      distinct: ['produitId']
    })
    
    console.log('📊 STATISTIQUES :')
    console.log(`   Stocks avec quantité > 0 : ${stocksAvecQte}`)
    console.log(`   Produits distincts avec stock > 0 : ${produitsAvecStock.length}`)
    console.log('')
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
