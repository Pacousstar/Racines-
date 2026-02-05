/**
 * Test de l'API Stock pour vérifier que les données sont accessibles
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

// Forcer l'utilisation de la base de données
const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Test de l\'API Stock...')
    console.log(`📂 Base de données: ${process.env.DATABASE_URL}`)
    console.log('')

    // Compter les produits
    const produitsCount = await prisma.produit.count({ where: { actif: true } })
    console.log(`✅ Produits actifs: ${produitsCount}`)

    // Compter les stocks
    const stocksCount = await prisma.stock.count()
    console.log(`✅ Lignes de stock: ${stocksCount}`)

    // Récupérer quelques stocks avec leurs relations
    const stocks = await prisma.stock.findMany({
      take: 5,
      include: {
        produit: { select: { code: true, designation: true } },
        magasin: { select: { code: true, nom: true } },
      },
      orderBy: { id: 'asc' },
    })

    console.log('')
    console.log('📦 Exemples de stocks:')
    stocks.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.produit.code} - ${s.produit.designation} | Magasin: ${s.magasin.code} | Quantité: ${s.quantite}`)
    })

    // Simuler la requête de l'API avec complet=1
    console.log('')
    console.log('🔍 Test mode complet (complet=1)...')
    const [tousProduits, tousStocks] = await Promise.all([
      prisma.produit.findMany({
        where: { actif: true },
        select: { id: true, code: true, designation: true, categorie: true, seuilMin: true, prixAchat: true, prixVente: true },
        orderBy: { code: 'asc' },
        take: 10,
      }),
      prisma.stock.findMany({
        include: {
          magasin: {
            select: { id: true, code: true, nom: true },
          },
        },
        take: 10,
      }),
    ])

    console.log(`✅ Produits récupérés: ${tousProduits.length}`)
    console.log(`✅ Stocks récupérés: ${tousStocks.length}`)

    const stocksMap = new Map(tousStocks.map(s => [s.produitId, s]))
    const out = tousProduits.map((produit) => {
      const stock = stocksMap.get(produit.id)
      if (stock) {
        return {
          id: stock.id,
          quantite: stock.quantite,
          produit: produit.code,
          magasin: stock.magasin.code,
        }
      } else {
        return {
          id: null,
          quantite: 0,
          produit: produit.code,
          magasin: 'N/A',
        }
      }
    })

    console.log('')
    console.log('📋 Résultat formaté (10 premiers):')
    out.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.produit} | Magasin: ${item.magasin} | Quantité: ${item.quantite}`)
    })

    console.log('')
    console.log('✅ Test réussi ! Les données sont accessibles via Prisma.')
    console.log('')
    console.log('💡 Si l\'interface affiche toujours 0, redémarrez le serveur Next.js:')
    console.log('   1. Arrêtez le serveur (Ctrl+C)')
    console.log('   2. Relancez: npm run dev')
    console.log('   3. Rechargez la page dans le navigateur (Ctrl+F5)')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
