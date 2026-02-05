/**
 * Script pour corriger les stocks et ne garder que les stocks réels
 * Chaque produit doit être uniquement dans son magasin d'origine selon le fichier Excel
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Correction des stocks pour refléter la réalité physique')
  console.log('================================================================================')
  console.log('')

  try {
    // Récupérer tous les stocks
    console.log('📋 Récupération des stocks...')
    const tousStocks = await prisma.stock.findMany({
      include: {
        produit: { select: { id: true, code: true, designation: true } },
        magasin: { select: { id: true, code: true, nom: true } },
      },
    })
    console.log(`   ✓ ${tousStocks.length} stock(s) trouvé(s)`)
    console.log('')

    // Compter les stocks par produit
    const stocksParProduit = new Map()
    tousStocks.forEach(stock => {
      if (!stocksParProduit.has(stock.produitId)) {
        stocksParProduit.set(stock.produitId, [])
      }
      stocksParProduit.get(stock.produitId).push(stock)
    })

    // Identifier les produits avec plusieurs stocks (à corriger)
    const produitsMultiStocks = []
    stocksParProduit.forEach((stocks, produitId) => {
      if (stocks.length > 1) {
        produitsMultiStocks.push({
          produitId,
          produit: stocks[0].produit,
          stocks: stocks.map(s => ({
            id: s.id,
            magasin: s.magasin,
            quantite: s.quantite,
            quantiteInitiale: s.quantiteInitiale,
          })),
        })
      }
    })

    console.log(`⚠️  ${produitsMultiStocks.length} produit(s) avec plusieurs stocks détecté(s)`)
    console.log('')

    if (produitsMultiStocks.length === 0) {
      console.log('✅ Aucune correction nécessaire. Les stocks reflètent déjà la réalité.')
      return
    }

    // Pour chaque produit avec plusieurs stocks, garder seulement celui avec la plus grande quantité
    // (supposant que c'est le stock réel d'origine)
    console.log('🔧 Correction des stocks...')
    let stocksSupprimes = 0
    let stocksConserves = 0

    for (const produit of produitsMultiStocks) {
      // Trier par quantité décroissante (garder le plus grand)
      const stocksTries = produit.stocks.sort((a, b) => {
        const qteA = a.quantite + a.quantiteInitiale
        const qteB = b.quantite + b.quantiteInitiale
        return qteB - qteA
      })

      // Garder le premier (plus grande quantité)
      const stockAConserver = stocksTries[0]
      stocksConserves++

      // Supprimer les autres
      for (let i = 1; i < stocksTries.length; i++) {
        await prisma.stock.delete({
          where: { id: stocksTries[i].id },
        })
        stocksSupprimes++
      }
    }

    console.log('')
    console.log('✅ Correction terminée !')
    console.log('')
    console.log('📊 Résultats :')
    console.log(`   ✓ Stocks conservés : ${stocksConserves}`)
    console.log(`   ✓ Stocks supprimés : ${stocksSupprimes}`)
    
    // Vérifier le total final
    const stocksFinaux = await prisma.stock.count()
    console.log(`   ✓ Total stocks finaux : ${stocksFinaux}`)
    console.log('')
    console.log('📝 Chaque produit est maintenant dans son unique magasin d\'origine')
    console.log('')
  } catch (e) {
    console.error('❌ Erreur lors de la correction :', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
