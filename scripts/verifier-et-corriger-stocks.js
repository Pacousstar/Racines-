/**
 * Vérifie et affiche les stocks, puis propose de corriger si nécessaire
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📦 VÉRIFICATION DES STOCKS')
    console.log('='.repeat(80))
    console.log('')
    
    const totalProduits = await prisma.produit.count()
    const totalStocks = await prisma.stock.count()
    const stocksAvecInitial = await prisma.stock.count({ where: { quantiteInitiale: { gt: 0 } } })
    const stocksAvecCourant = await prisma.stock.count({ where: { quantite: { gt: 0 } } })
    
    console.log(`📊 Total produits : ${totalProduits}`)
    console.log(`📦 Total stocks : ${totalStocks}`)
    console.log(`📈 Stocks avec quantité initiale > 0 : ${stocksAvecInitial}`)
    console.log(`📊 Stocks avec quantité courante > 0 : ${stocksAvecCourant}`)
    console.log('')
    
    // Vérifier quelques stocks
    const exemples = await prisma.stock.findMany({
      take: 10,
      include: {
        produit: { select: { code: true, designation: true } },
        magasin: { select: { nom: true } }
      }
    })
    
    console.log('📋 EXEMPLES DE STOCKS (10 premiers) :')
    exemples.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.produit.code} - ${s.produit.designation}`)
      console.log(`      Magasin : ${s.magasin.nom}`)
      console.log(`      Quantité initiale : ${s.quantiteInitiale}`)
      console.log(`      Quantité courante : ${s.quantite}`)
      console.log('')
    })
    
    // Statistiques
    const stats = await prisma.stock.aggregate({
      _sum: { quantiteInitiale: true, quantite: true },
      _avg: { quantiteInitiale: true, quantite: true },
      _max: { quantiteInitiale: true, quantite: true },
      _min: { quantiteInitiale: true, quantite: true }
    })
    
    console.log('📊 STATISTIQUES :')
    console.log(`   Somme quantité initiale : ${stats._sum.quantiteInitiale || 0}`)
    console.log(`   Somme quantité courante : ${stats._sum.quantite || 0}`)
    console.log(`   Moyenne quantité initiale : ${(stats._avg.quantiteInitiale || 0).toFixed(2)}`)
    console.log(`   Moyenne quantité courante : ${(stats._avg.quantite || 0).toFixed(2)}`)
    console.log(`   Max quantité initiale : ${stats._max.quantiteInitiale || 0}`)
    console.log(`   Max quantité courante : ${stats._max.quantite || 0}`)
    console.log('')
    
    if (stocksAvecInitial === 0 && stocksAvecCourant === 0) {
      console.log('⚠️  ATTENTION : Aucun stock avec quantité > 0 !')
      console.log('   Les stocks initiaux n\'ont pas été importés correctement.')
      console.log('   Il faut réimporter les données depuis le fichier Excel.')
      console.log('')
    }
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
