/**
 * Identifie les produits qui ont plusieurs lignes de stock (plusieurs magasins)
 * Chaque produit ne doit être que dans UN SEUL magasin
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 IDENTIFICATION DES PRODUITS AVEC PLUSIEURS MAGASINS')
    console.log('='.repeat(80))
    console.log('')
    
    // Récupérer tous les stocks groupés par produit
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
        magasinId: stock.magasinId,
        magasin: stock.magasin,
        stockId: stock.id,
        quantite: stock.quantite,
        quantiteInitiale: stock.quantiteInitiale
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
    
    console.log(`📊 Total produits : ${Object.keys(produitsParMagasin).length}`)
    console.log(`📊 Total lignes de stock : ${stocks.length}`)
    console.log(`⚠️  Produits avec plusieurs magasins : ${produitsMultiples.length}`)
    console.log('')
    
    if (produitsMultiples.length > 0) {
      console.log('📋 LISTE DES PRODUITS AVEC PLUSIEURS MAGASINS :')
      console.log('')
      
      produitsMultiples.forEach((p, index) => {
        console.log(`${index + 1}. ${p.produit.code} - ${p.produit.designation}`)
        console.log(`   Produit ID: ${p.produitId}`)
        console.log(`   Magasins (${p.magasins.length}) :`)
        p.magasins.forEach((m, i) => {
          const totalQte = m.quantite + m.quantiteInitiale
          console.log(`      ${i + 1}. ${m.magasin.code} (${m.magasin.nom}) - Stock ID: ${m.stockId}`)
          console.log(`         Quantité courante: ${m.quantite}, Quantité initiale: ${m.quantiteInitiale}, Total: ${totalQte}`)
        })
        console.log('')
      })
      
      // Statistiques
      const totalLignesEnTrop = produitsMultiples.reduce((sum, p) => sum + (p.magasins.length - 1), 0)
      console.log(`📊 Statistiques :`)
      console.log(`   - Produits concernés : ${produitsMultiples.length}`)
      console.log(`   - Lignes de stock en trop : ${totalLignesEnTrop}`)
      console.log(`   - (Chaque produit devrait avoir 1 seule ligne, donc ${totalLignesEnTrop} lignes à supprimer)`)
      console.log('')
      
      // Recommandation : garder le magasin avec le plus de stock
      console.log('💡 RECOMMANDATION :')
      console.log('   Pour chaque produit, garder UN SEUL magasin (celui avec le plus de stock)')
      console.log('   et supprimer les autres lignes de stock.')
      console.log('')
    } else {
      console.log('✅ Aucun produit avec plusieurs magasins. Tous les produits sont correctement associés à un seul magasin.')
      console.log('')
    }
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    console.error(e.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
