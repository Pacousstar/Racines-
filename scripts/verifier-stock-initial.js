/**
 * Vérifie et affiche le stock initial de tous les produits
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📦 VÉRIFICATION DU STOCK INITIAL')
    console.log('='.repeat(80))
    console.log('')
    
    // Compter les produits
    const totalProduits = await prisma.produit.count()
    console.log(`📊 Total produits : ${totalProduits}`)
    
    // Compter les stocks
    const totalStocks = await prisma.stock.count()
    console.log(`📦 Total stocks : ${totalStocks}`)
    
    // Stocks avec quantité initiale > 0
    const stocksAvecInitial = await prisma.stock.count({
      where: { quantiteInitiale: { gt: 0 } }
    })
    console.log(`📈 Stocks avec quantité initiale > 0 : ${stocksAvecInitial}`)
    
    // Stocks avec quantité courante > 0
    const stocksAvecCourant = await prisma.stock.count({
      where: { quantite: { gt: 0 } }
    })
    console.log(`📊 Stocks avec quantité courante > 0 : ${stocksAvecCourant}`)
    console.log('')
    
    // Statistiques par magasin
    console.log('🏪 STOCKS PAR MAGASIN :')
    const stocksParMagasin = await prisma.stock.groupBy({
      by: ['magasinId'],
      _count: { id: true },
      _sum: { 
        quantiteInitiale: true,
        quantite: true
      },
      where: { quantiteInitiale: { gt: 0 } }
    })
    
    for (const stat of stocksParMagasin) {
      const magasin = await prisma.magasin.findUnique({
        where: { id: stat.magasinId },
        select: { nom: true, code: true }
      })
      
      console.log(`   ${magasin?.nom || 'Inconnu'} (${magasin?.code || 'N/A'}) :`)
      console.log(`      - ${stat._count.id} produit(s) avec stock initial`)
      console.log(`      - Quantité initiale totale : ${stat._sum.quantiteInitiale || 0}`)
      console.log(`      - Quantité courante totale : ${stat._sum.quantite || 0}`)
    }
    console.log('')
    
    // Exemples de produits avec stock initial
    console.log('📋 EXEMPLES DE PRODUITS AVEC STOCK INITIAL (10 premiers) :')
    const exemples = await prisma.stock.findMany({
      where: { quantiteInitiale: { gt: 0 } },
      include: {
        produit: { select: { code: true, designation: true } },
        magasin: { select: { nom: true } }
      },
      take: 10,
      orderBy: { quantiteInitiale: 'desc' }
    })
    
    exemples.forEach((stock, i) => {
      console.log(`   ${i + 1}. ${stock.produit.code} - ${stock.produit.designation}`)
      console.log(`      Magasin : ${stock.magasin.nom}`)
      console.log(`      Stock initial : ${stock.quantiteInitiale}`)
      console.log(`      Stock courant : ${stock.quantite}`)
      console.log('')
    })
    
    // Résumé
    const totalQuantiteInitiale = await prisma.stock.aggregate({
      _sum: { quantiteInitiale: true }
    })
    
    const totalQuantiteCourante = await prisma.stock.aggregate({
      _sum: { quantite: true }
    })
    
    console.log('📊 RÉSUMÉ GLOBAL :')
    console.log(`   Total quantité initiale : ${totalQuantiteInitiale._sum.quantiteInitiale || 0}`)
    console.log(`   Total quantité courante : ${totalQuantiteCourante._sum.quantite || 0}`)
    console.log('')
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
