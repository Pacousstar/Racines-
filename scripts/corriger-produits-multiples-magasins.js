/**
 * Corrige les produits qui ont plusieurs magasins
 * Pour chaque produit, garde UN SEUL magasin (celui avec le plus de stock)
 * et supprime les autres lignes de stock
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔧 CORRECTION DES PRODUITS AVEC PLUSIEURS MAGASINS')
    console.log('='.repeat(80))
    console.log('')
    
    // Récupérer tous les stocks
    const stocks = await prisma.stock.findMany({
      include: {
        produit: { select: { id: true, code: true, designation: true } },
        magasin: { select: { id: true, code: true, nom: true } }
      },
      orderBy: [{ produitId: 'asc' }, { magasinId: 'asc' }]
    })
    
    // Grouper par produit
    const produitsParMagasin = {}
    stocks.forEach(stock => {
      const produitId = stock.produitId
      if (!produitsParMagasin[produitId]) {
        produitsParMagasin[produitId] = {
          produit: stock.produit,
          magasins: []
        }
      }
      produitsParMagasin[produitId].magasins.push({
        stockId: stock.id,
        magasinId: stock.magasinId,
        magasin: stock.magasin,
        quantite: stock.quantite,
        quantiteInitiale: stock.quantiteInitiale,
        totalStock: stock.quantite + stock.quantiteInitiale
      })
    })
    
    // Identifier les produits avec plusieurs magasins
    const produitsMultiples = Object.entries(produitsParMagasin)
      .filter(([_, data]) => data.magasins.length > 1)
      .map(([produitId, data]) => ({
        produitId: parseInt(produitId),
        produit: data.produit,
        magasins: data.magasins
      }))
    
    console.log(`📊 Produits avec plusieurs magasins : ${produitsMultiples.length}`)
    console.log('')
    
    if (produitsMultiples.length === 0) {
      console.log('✅ Aucun produit à corriger. Tous les produits sont correctement associés à un seul magasin.')
      return
    }
    
    let lignesSupprimees = 0
    let produitsCorriges = 0
    
    for (const p of produitsMultiples) {
      // Trier les magasins par stock total (décroissant)
      const magasinsTries = [...p.magasins].sort((a, b) => b.totalStock - a.totalStock)
      
      // Le premier est celui à garder
      const magasinAGarder = magasinsTries[0]
      const magasinsASupprimer = magasinsTries.slice(1)
      
      console.log(`📦 ${p.produit.code} - ${p.produit.designation}`)
      console.log(`   ✅ Garde : ${magasinAGarder.magasin.code} (${magasinAGarder.magasin.nom}) - Stock total: ${magasinAGarder.totalStock}`)
      
      // Supprimer les autres lignes de stock
      for (const m of magasinsASupprimer) {
        console.log(`   ❌ Supprime : ${m.magasin.code} (${m.magasin.nom}) - Stock ID: ${m.stockId} - Stock total: ${m.totalStock}`)
        
        // Supprimer les mouvements associés
        await prisma.mouvement.deleteMany({
          where: {
            produitId: p.produitId,
            magasinId: m.magasinId
          }
        })
        
        // Supprimer les lignes de vente associées (via produit)
        // Note: Les lignes de vente ne sont pas directement liées au stock, donc on ne les supprime pas
        
        // Supprimer la ligne de stock
        await prisma.stock.delete({
          where: { id: m.stockId }
        })
        
        lignesSupprimees++
      }
      
      produitsCorriges++
      console.log('')
    }
    
    console.log('✅ CORRECTION TERMINÉE')
    console.log(`📊 Produits corrigés : ${produitsCorriges}`)
    console.log(`📊 Lignes de stock supprimées : ${lignesSupprimees}`)
    console.log('')
    
    // Vérification finale
    const stocksFinaux = await prisma.stock.count()
    const produitsFinaux = await prisma.produit.count()
    console.log('📊 VÉRIFICATION FINALE :')
    console.log(`   Produits : ${produitsFinaux}`)
    console.log(`   Lignes de stock : ${stocksFinaux}`)
    console.log(`   Différence : ${stocksFinaux - produitsFinaux} (devrait être 0 ou proche de 0)`)
    console.log('')
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    console.error(e.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
