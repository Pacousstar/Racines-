/**
 * Script pour initialiser les stocks des produits qui n'en ont pas
 * 
 * RÈGLE MÉTIER : Un produit = UN SEUL magasin
 * Ce script crée un stock (quantité = 0) pour chaque produit qui n'en a pas encore.
 * Le magasin utilisé est celui du produit existant (si le produit a déjà un stock) 
 * ou le premier magasin disponible.
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Liste officielle des magasins
const MAGASINS_OFFICIELS = ['MAG01', 'MAG02', 'MAG03', 'STOCK01', 'STOCK03', 'DANANE', 'GUIGLO', 'PARE-BRISE', 'PARABRISE']

async function main() {
  console.log('📦 Initialisation des stocks pour tous les produits dans tous les magasins')
  console.log('================================================================================')
  console.log('')

  try {
    // Récupérer tous les produits actifs
    console.log('📋 Récupération des produits...')
    const produits = await prisma.produit.findMany({
      where: { actif: true },
      select: { id: true, code: true, designation: true },
    })
    console.log(`   ✓ ${produits.length} produit(s) trouvé(s)`)
    console.log('')

    // Récupérer tous les magasins officiels
    console.log('🏪 Récupération des magasins officiels...')
    const magasins = await prisma.magasin.findMany({
      where: {
        code: { in: MAGASINS_OFFICIELS },
        actif: true,
      },
      select: { id: true, code: true, nom: true },
    })
    console.log(`   ✓ ${magasins.length} magasin(s) trouvé(s)`)
    magasins.forEach(m => {
      console.log(`      - ${m.code} (${m.nom})`)
    })
    console.log('')

    if (magasins.length === 0) {
      console.log('❌ Aucun magasin officiel trouvé. Veuillez d\'abord exécuter l\'import.')
      return
    }

    // Créer un Map pour faciliter l'accès
    const magasinMap = new Map()
    magasins.forEach(m => {
      magasinMap.set(m.code, m.id)
    })

    // Récupérer les stocks existants
    console.log('🔍 Vérification des stocks existants...')
    const stocksExistants = await prisma.stock.findMany({
      select: {
        produitId: true,
        magasinId: true,
      },
    })

    // Créer un Set pour vérifier rapidement si un stock existe
    const stocksExistantsSet = new Set()
    stocksExistants.forEach(s => {
      stocksExistantsSet.add(`${s.produitId}-${s.magasinId}`)
    })
    console.log(`   ✓ ${stocksExistants.length} stock(s) existant(s)`)
    console.log('')

    // RÈGLE MÉTIER : Un produit = UN SEUL magasin
    // Créer un stock uniquement pour les produits qui n'en ont pas
    console.log('📦 Création des stocks manquants...')
    console.log('   ⚠️  RÈGLE : Un produit = UN SEUL magasin')
    console.log('')
    let stocksCrees = 0
    let produitsAvecStock = 0
    let erreurs = []
    const premierMagasinId = magasins.length > 0 ? magasins[0].id : null

    if (!premierMagasinId) {
      console.log('❌ Aucun magasin disponible.')
      return
    }

    for (const produit of produits) {
      // Vérifier si le produit a déjà un stock (peu importe le magasin)
      const stockExistant = await prisma.stock.findFirst({
        where: { produitId: produit.id }
      })
      
      if (stockExistant) {
        produitsAvecStock++
        continue
      }

      // Le produit n'a pas de stock, créer un stock dans le premier magasin
      try {
        await prisma.stock.create({
          data: {
            produitId: produit.id,
            magasinId: premierMagasinId,
            quantite: 0,
            quantiteInitiale: 0,
          },
        })
        stocksCrees++
      } catch (e) {
        erreurs.push(`${produit.code} (${produit.designation.substring(0, 30)}...): ${e.message}`)
      }
    }

    console.log('')
    console.log('✅ Initialisation terminée !')
    console.log('')
    console.log('📊 Résultats :')
    console.log(`   ✓ Produits avec stock existant : ${produitsAvecStock}`)
    console.log(`   ✓ Stocks créés : ${stocksCrees}`)
    console.log(`   ✓ Total produits avec stock : ${produitsAvecStock + stocksCrees}`)
    console.log(`   ✓ Total produits : ${produits.length}`)
    
    if (erreurs.length > 0) {
      console.log(`   ⚠️  Erreurs : ${erreurs.length}`)
      if (erreurs.length <= 10) {
        erreurs.forEach(err => console.log(`      - ${err}`))
      } else {
        erreurs.slice(0, 10).forEach(err => console.log(`      - ${err}`))
        console.log(`      ... et ${erreurs.length - 10} autre(s) erreur(s)`)
      }
    }
    console.log('')
    console.log('📝 Note importante :')
    console.log('   - Chaque produit est associé à UN SEUL magasin')
    console.log('   - Les produits sans stock ont été initialisés dans le premier magasin disponible')
    console.log('   - Vous pouvez créer de nouveaux produits avec leur stock initial')
    console.log('')
  } catch (e) {
    console.error('❌ Erreur lors de l\'initialisation :', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
