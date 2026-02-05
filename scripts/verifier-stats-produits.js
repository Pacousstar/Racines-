/**
 * Script pour vérifier les statistiques des produits
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Total produits actifs
    const total = await prisma.produit.count({ where: { actif: true } })
    
    // Produits avec au moins un stock > 0
    const enStockRows = await prisma.stock.groupBy({
      by: ['produitId'],
      where: { quantite: { gt: 0 } },
    })
    const enStock = enStockRows.length
    
    // Total stocks
    const totalStocks = await prisma.stock.count()
    
    // Produits avec stock = 0
    const produitsAvecStockZero = await prisma.stock.groupBy({
      by: ['produitId'],
      where: { quantite: 0 },
    })
    
    console.log('📊 STATISTIQUES PRODUITS')
    console.log('='.repeat(80))
    console.log(`Total produits (actifs) : ${total}`)
    console.log(`Produits en stock (quantité > 0) : ${enStock}`)
    console.log(`Total stocks : ${totalStocks}`)
    console.log(`Produits avec stock = 0 : ${produitsAvecStockZero.length}`)
    console.log('')
    
    // Vérifier si tous les produits ont un stock
    const produitsSansStock = await prisma.produit.findMany({
      where: { 
        actif: true,
        stocks: { none: {} }
      },
      select: { id: true, code: true, designation: true }
    })
    
    if (produitsSansStock.length > 0) {
      console.log(`⚠️  Produits sans stock : ${produitsSansStock.length}`)
      produitsSansStock.slice(0, 10).forEach(p => {
        console.log(`   - ${p.code}: ${p.designation}`)
      })
    } else {
      console.log('✅ Tous les produits ont au moins un stock')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
