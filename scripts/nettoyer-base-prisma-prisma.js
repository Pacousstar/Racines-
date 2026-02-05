/**
 * Nettoie la base dans prisma/prisma/gesticom.db pour ramener à 3290 produits
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, '..', 'prisma', 'prisma', 'gesticom.db')

if (!fs.existsSync(dbPath)) {
  console.log('❌ Base non trouvée:', dbPath)
  process.exit(1)
}

process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🧹 NETTOYAGE DE LA BASE: prisma/prisma/gesticom.db')
    console.log('='.repeat(80))
    console.log('')
    
    const totalActuel = await prisma.produit.count()
    const actifs = await prisma.produit.count({ where: { actif: true } })
    const inactifs = await prisma.produit.count({ where: { actif: false } })
    console.log(`📊 Produits totaux : ${totalActuel}`)
    console.log(`   - Actifs : ${actifs}`)
    console.log(`   - Inactifs : ${inactifs}`)
    console.log(`🎯 Objectif : 3290 produits`)
    console.log(`📉 À supprimer : ${totalActuel - 3290} produits`)
    console.log('')
    
    if (totalActuel <= 3290) {
      console.log('✅ Aucun produit à supprimer. Le nombre est déjà correct.')
      return
    }
    
    // Récupérer tous les produits triés par date de création (les plus récents en premier)
    const tousProduits = await prisma.produit.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, code: true, designation: true, createdAt: true }
    })
    
    // Garder les 3290 premiers (les plus récents)
    const produitsAGarder = tousProduits.slice(0, 3290)
    const produitsASupprimer = tousProduits.slice(3290)
    
    console.log(`✅ Produits à garder : ${produitsAGarder.length}`)
    console.log(`🗑️  Produits à supprimer : ${produitsASupprimer.length}`)
    console.log('')
    
    if (produitsASupprimer.length === 0) {
      console.log('✅ Aucun produit à supprimer.')
      return
    }
    
    // Afficher un échantillon
    console.log('📋 Échantillon des produits à supprimer (premiers 10) :')
    produitsASupprimer.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.code} - ${p.designation}`)
    })
    if (produitsASupprimer.length > 10) {
      console.log(`   ... et ${produitsASupprimer.length - 10} autres`)
    }
    console.log('')
    
    // Supprimer les stocks associés d'abord
    console.log('🗑️  Suppression des stocks associés...')
    const idsProduitsASupprimer = produitsASupprimer.map(p => p.id)
    
    const stocksSupprimes = await prisma.stock.deleteMany({
      where: { produitId: { in: idsProduitsASupprimer } }
    })
    console.log(`   ✓ ${stocksSupprimes.count} stock(s) supprimé(s)`)
    
    const mouvementsSupprimes = await prisma.mouvement.deleteMany({
      where: { produitId: { in: idsProduitsASupprimer } }
    })
    console.log(`   ✓ ${mouvementsSupprimes.count} mouvement(s) supprimé(s)`)
    
    const ventesLignes = await prisma.venteLigne.deleteMany({
      where: { produitId: { in: idsProduitsASupprimer } }
    })
    console.log(`   ✓ ${ventesLignes.count} ligne(s) de vente supprimée(s)`)
    
    const achatsLignes = await prisma.achatLigne.deleteMany({
      where: { produitId: { in: idsProduitsASupprimer } }
    })
    console.log(`   ✓ ${achatsLignes.count} ligne(s) d'achat supprimée(s)`)
    
    // Supprimer les produits
    console.log('🗑️  Suppression des produits...')
    const produitsSupprimes = await prisma.produit.deleteMany({
      where: { id: { in: idsProduitsASupprimer } }
    })
    console.log(`   ✓ ${produitsSupprimes.count} produit(s) supprimé(s)`)
    console.log('')
    
    // Vérifier le résultat
    const totalFinal = await prisma.produit.count()
    const actifsFinal = await prisma.produit.count({ where: { actif: true } })
    const inactifsFinal = await prisma.produit.count({ where: { actif: false } })
    console.log('✅ NETTOYAGE TERMINÉ')
    console.log(`📊 Produits finaux : ${totalFinal}`)
    console.log(`   - Actifs : ${actifsFinal}`)
    console.log(`   - Inactifs : ${inactifsFinal}`)
    console.log(`🎯 Objectif atteint : ${totalFinal === 3290 ? '✅ OUI' : '❌ NON'}`)
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('✨ Opération terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('')
    console.error('💥 Erreur fatale :', error)
    process.exit(1)
  })
