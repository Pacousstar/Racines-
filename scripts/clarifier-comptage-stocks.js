/**
 * Clarifie la différence entre le comptage des stocks
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📊 CLARIFICATION DU COMPTAGE DES STOCKS')
    console.log('='.repeat(80))
    console.log('')
    
    // Produits totaux
    const totalProduits = await prisma.produit.count()
    console.log(`📦 Produits totaux dans la base : ${totalProduits}`)
    
    // Lignes de stock totales (produit × magasin)
    const totalStocks = await prisma.stock.count()
    console.log(`📦 Lignes de stock totales (produit × magasin) : ${totalStocks}`)
    
    // Produits distincts avec stock > 0
    const stocksAvecQte = await prisma.stock.findMany({
      where: { quantite: { gt: 0 } },
      select: { produitId: true }
    })
    const produitsDistinctsAvecStock = new Set(stocksAvecQte.map(s => s.produitId))
    console.log(`📦 Produits distincts avec stock > 0 : ${produitsDistinctsAvecStock.size}`)
    
    // Lignes de stock avec quantité > 0
    const lignesAvecQte = await prisma.stock.count({
      where: { quantite: { gt: 0 } }
    })
    console.log(`📦 Lignes de stock avec quantité > 0 : ${lignesAvecQte}`)
    
    console.log('')
    console.log('💡 EXPLICATION :')
    console.log('   - L\'interface compte probablement les PRODUITS (3290 produits)')
    console.log('   - Mon script compte les LIGNES DE STOCK (3378 lignes = produit × magasin)')
    console.log('   - Un produit peut avoir plusieurs lignes de stock (une par magasin)')
    console.log('   - Exemple : Produit A dans Magasin 1 = 1 ligne, Produit A dans Magasin 2 = 1 autre ligne')
    console.log('')
    console.log(`   Différence : ${totalStocks - totalProduits} lignes supplémentaires`)
    console.log('   (cela signifie que certains produits sont présents dans plusieurs magasins)')
    console.log('')
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
