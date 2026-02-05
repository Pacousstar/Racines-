/**
 * Nettoie complètement la base de données avant un nouvel import
 * 
 * Supprime :
 * - Tous les produits
 * - Tous les stocks
 * - Tous les mouvements de stock
 * - Toutes les lignes de ventes et achats (liées aux produits)
 * 
 * Conserve :
 * - Magasins (seront réutilisés)
 * - Utilisateurs
 * - Entités
 * - Clients, Fournisseurs
 * - Ventes, Achats (sans les lignes)
 * - Autres données métier
 * 
 * Usage: node scripts/nettoyer-bd-complete.js
 */

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

// Charger DATABASE_URL
const envPath = path.join(__dirname, '..', '.env')
const urlPath = path.join(__dirname, '..', '.database_url')

if (fs.existsSync(urlPath)) {
  process.env.DATABASE_URL = fs.readFileSync(urlPath, 'utf8').trim()
} else if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const m = content.match(/DATABASE_URL\s*=\s*["']?([^"'\s]+)/)
  if (m) process.env.DATABASE_URL = m[1].trim()
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant. Définissez-le dans .env ou .database_url.')
  process.exit(1)
}

const prisma = new PrismaClient()

async function nettoyer() {
  try {
    console.log('🧹 NETTOYAGE COMPLET DE LA BASE DE DONNÉES')
    console.log('='.repeat(80))
    console.log('')
    
    // Compter avant suppression
    const produitsCount = await prisma.produit.count()
    const stocksCount = await prisma.stock.count()
    const mouvementsCount = await prisma.mouvement.count()
    const ventesLignesCount = await prisma.venteLigne.count()
    const achatsLignesCount = await prisma.achatLigne.count()
    
    console.log('📊 État actuel :')
    console.log(`   - Produits : ${produitsCount}`)
    console.log(`   - Stocks : ${stocksCount}`)
    console.log(`   - Mouvements : ${mouvementsCount}`)
    console.log(`   - Lignes de ventes : ${ventesLignesCount}`)
    console.log(`   - Lignes d'achats : ${achatsLignesCount}`)
    console.log('')
    
    if (produitsCount === 0) {
      console.log('✅ La base est déjà vide. Aucune suppression nécessaire.')
      return
    }
    
    console.log('🗑️  Suppression en cours...')
    console.log('')
    
    // Supprimer dans l'ordre des dépendances (enfants d'abord)
    
    // 1. Lignes de ventes (dépendent des produits)
    console.log('   1. Suppression des lignes de ventes...')
    const ventesLignesSupprimees = await prisma.venteLigne.deleteMany({})
    console.log(`      ✓ ${ventesLignesSupprimees.count} ligne(s) de vente supprimée(s)`)
    
    // 2. Lignes d'achats (dépendent des produits)
    console.log('   2. Suppression des lignes d\'achats...')
    const achatsLignesSupprimees = await prisma.achatLigne.deleteMany({})
    console.log(`      ✓ ${achatsLignesSupprimees.count} ligne(s) d'achat supprimée(s)`)
    
    // 3. Mouvements de stock (dépendent des produits)
    console.log('   3. Suppression des mouvements de stock...')
    const mouvementsSupprimes = await prisma.mouvement.deleteMany({})
    console.log(`      ✓ ${mouvementsSupprimes.count} mouvement(s) supprimé(s)`)
    
    // 4. Stocks (dépendent des produits)
    console.log('   4. Suppression des stocks...')
    const stocksSupprimes = await prisma.stock.deleteMany({})
    console.log(`      ✓ ${stocksSupprimes.count} stock(s) supprimé(s)`)
    
    // 5. Produits (derniers, car référencés par tout le reste)
    console.log('   5. Suppression des produits...')
    const produitsSupprimes = await prisma.produit.deleteMany({})
    console.log(`      ✓ ${produitsSupprimes.count} produit(s) supprimé(s)`)
    
    console.log('')
    console.log('✅ NETTOYAGE TERMINÉ')
    console.log('')
    
    // Vérifier le résultat
    const produitsFinal = await prisma.produit.count()
    const stocksFinal = await prisma.stock.count()
    const mouvementsFinal = await prisma.mouvement.count()
    
    console.log('📊 État final :')
    console.log(`   - Produits : ${produitsFinal}`)
    console.log(`   - Stocks : ${stocksFinal}`)
    console.log(`   - Mouvements : ${mouvementsFinal}`)
    console.log('')
    
    // Afficher ce qui est conservé
    const magasinsCount = await prisma.magasin.count()
    const utilisateursCount = await prisma.utilisateur.count()
    const entitesCount = await prisma.entite.count()
    
    console.log('✅ Données conservées :')
    console.log(`   - Magasins : ${magasinsCount}`)
    console.log(`   - Utilisateurs : ${utilisateursCount}`)
    console.log(`   - Entités : ${entitesCount}`)
    console.log('')
    console.log('📝 Vous pouvez maintenant relancer l\'import avec : npm run db:importer')
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter
nettoyer()
  .then(() => {
    console.log('✨ Opération terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('')
    console.error('💥 Erreur fatale :', error)
    process.exit(1)
  })
