/**
 * Vérifie les stocks réels dans la base actuelle
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📊 VÉRIFICATION DES STOCKS RÉELS')
    console.log('='.repeat(80))
    console.log('')
    
    // Compter tous les stocks
    const totalStocks = await prisma.stock.count()
    console.log(`📦 Total lignes de stock : ${totalStocks}`)
    
    // Stocks avec quantité > 0
    const stocksAvecQte = await prisma.stock.count({
      where: { quantite: { gt: 0 } }
    })
    console.log(`📦 Stocks avec quantité > 0 : ${stocksAvecQte}`)
    
    // Stocks avec quantité initiale > 0
    const stocksAvecQteInitiale = await prisma.stock.count({
      where: { quantiteInitiale: { gt: 0 } }
    })
    console.log(`📦 Stocks avec quantité initiale > 0 : ${stocksAvecQteInitiale}`)
    
    // Total quantité
    const totalQte = await prisma.stock.aggregate({
      _sum: { quantite: true }
    })
    console.log(`📦 Total quantité courante : ${totalQte._sum.quantite || 0}`)
    
    // Total quantité initiale
    const totalQteInitiale = await prisma.stock.aggregate({
      _sum: { quantiteInitiale: true }
    })
    console.log(`📦 Total quantité initiale : ${totalQteInitiale._sum.quantiteInitiale || 0}`)
    
    // Produits distincts avec stock > 0
    const produitsAvecStock = await prisma.stock.findMany({
      where: { quantite: { gt: 0 } },
      select: { produitId: true },
      distinct: ['produitId']
    })
    console.log(`📦 Produits distincts avec stock > 0 : ${produitsAvecStock.length}`)
    
    // Détail par magasin
    const stocksParMagasin = await prisma.stock.groupBy({
      by: ['magasinId'],
      _count: { id: true },
      _sum: { quantite: true, quantiteInitiale: true },
      where: { quantite: { gt: 0 } }
    })
    
    const magasins = await prisma.magasin.findMany({
      select: { id: true, code: true, nom: true }
    })
    
    console.log('')
    console.log('📊 STOCKS PAR MAGASIN (avec quantité > 0) :')
    stocksParMagasin.forEach(s => {
      const magasin = magasins.find(m => m.id === s.magasinId)
      console.log(`   ${magasin?.code || 'N/A'} (${magasin?.nom || 'N/A'}) : ${s._count.id} lignes, ${s._sum.quantite || 0} unités`)
    })
    
    console.log('')
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
