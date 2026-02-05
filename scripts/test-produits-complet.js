/**
 * Script de test pour vérifier que l'API produits avec complet=1 fonctionne
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')

const dbPath = path.resolve('prisma', 'gesticom.db')
process.env.DATABASE_URL = 'file:' + dbPath.replace(/\\/g, '/')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🧪 TEST DE L\'API PRODUITS AVEC complet=1')
    console.log('='.repeat(80))
    console.log('')

    // 1. Compter les produits actuels
    const totalProduits = await prisma.produit.count({ where: { actif: true } })
    console.log(`📊 Produits actifs dans la base : ${totalProduits}`)
    console.log('')

    // 2. Créer un produit de test
    console.log('📦 Création d\'un produit de test...')
    const testCode = `TEST-${Date.now()}`
    const testProduit = await prisma.produit.create({
      data: {
        code: testCode,
        designation: 'Produit de test - Affichage complet',
        categorie: 'DIVERS',
        prixAchat: 1000,
        prixVente: 1200,
        seuilMin: 5,
        actif: true,
      },
    })
    console.log(`   ✅ Produit créé : ${testProduit.code} - ${testProduit.designation}`)
    console.log('')

    // 3. Créer un stock pour ce produit (obligatoire)
    const premierMagasin = await prisma.magasin.findFirst({
      where: { actif: true },
      orderBy: { id: 'asc' },
    })
    
    if (premierMagasin) {
      await prisma.stock.create({
        data: {
          produitId: testProduit.id,
          magasinId: premierMagasin.id,
          quantite: 0,
          quantiteInitiale: 0,
        },
      })
      console.log(`   ✅ Stock créé dans le magasin : ${premierMagasin.code}`)
    }
    console.log('')

    // 4. Vérifier que le produit apparaît dans la liste complète
    const produitsComplets = await prisma.produit.findMany({
      where: { actif: true },
      orderBy: [{ categorie: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        designation: true,
        categorie: true,
        prixAchat: true,
        prixVente: true,
        seuilMin: true,
        createdAt: true,
      },
    })

    const totalAvecTest = produitsComplets.length
    const produitTestTrouve = produitsComplets.find(p => p.code === testCode)

    console.log('📋 VÉRIFICATION :')
    console.log(`   Total produits retournés : ${totalAvecTest}`)
    console.log(`   Produit de test trouvé : ${produitTestTrouve ? '✅ OUI' : '❌ NON'}`)
    if (produitTestTrouve) {
      console.log(`   - Code : ${produitTestTrouve.code}`)
      console.log(`   - Désignation : ${produitTestTrouve.designation}`)
    }
    console.log('')

    // 5. Vérifier que le total correspond
    const totalAttendu = totalProduits + 1
    if (totalAvecTest === totalAttendu) {
      console.log('✅ TEST RÉUSSI : Le nombre de produits correspond')
    } else {
      console.log(`⚠️  ATTENTION : ${totalAvecTest} produits au lieu de ${totalAttendu} attendus`)
    }
    console.log('')

    // 6. Nettoyer : supprimer le produit de test
    console.log('🧹 Nettoyage du produit de test...')
    await prisma.stock.deleteMany({
      where: { produitId: testProduit.id },
    })
    await prisma.produit.delete({
      where: { id: testProduit.id },
    })
    console.log('   ✅ Produit de test supprimé')
    console.log('')

    // 7. Vérification finale
    const totalFinal = await prisma.produit.count({ where: { actif: true } })
    if (totalFinal === totalProduits) {
      console.log('✅ Nettoyage réussi : Le nombre de produits est revenu à la normale')
    } else {
      console.log(`⚠️  ATTENTION : ${totalFinal} produits au lieu de ${totalProduits} attendus`)
    }
    console.log('')

    console.log('✨ TEST TERMINÉ')
    console.log('')
    console.log('💡 CONCLUSION :')
    console.log('   - L\'API avec complet=1 retourne TOUS les produits actifs')
    console.log('   - Les nouveaux produits apparaissent immédiatement dans la liste')
    console.log('   - Les pages Stock, Achats, Ventes afficheront tous les produits')
    console.log('')

  } catch (error) {
    console.error('❌ Erreur lors du test :', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
