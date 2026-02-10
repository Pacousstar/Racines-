/**
 * Script pour optimiser les performances de la base de données
 * - Vérifie et crée les index manquants
 * - Optimise les requêtes SQLite
 */

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

// Charger DATABASE_URL
const envPath = path.join(__dirname, '..', '.env')
let databaseUrl = 'file:C:/gesticom/gesticom.db'

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const m = content.match(/DATABASE_URL\s*=\s*["']?([^"'\n\r]+)["']?/)
  if (m) {
    databaseUrl = m[1].trim()
    if (databaseUrl.includes('./') || databaseUrl.includes('prisma')) {
      databaseUrl = 'file:C:/gesticom/gesticom.db'
    }
  }
}

const dbPathDefault = 'C:/gesticom/gesticom.db'
if (fs.existsSync(dbPathDefault)) {
  databaseUrl = `file:${dbPathDefault}`
}

process.env.DATABASE_URL = databaseUrl

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function optimiser() {
  console.log('⚡ Optimisation des performances de la base de données')
  console.log('='.repeat(80))
  console.log('')
  
  try {
    // 1. Vérifier les index existants
    console.log('📊 Vérification des index...')
    
    const indexStock = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='Stock' AND name LIKE '%quantite%'
    `)
    
    const indexProduitActif = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='Produit' AND name LIKE '%actif%'
    `)
    
    const indexClientActif = await prisma.$queryRawUnsafe(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='Client' AND name LIKE '%actif%'
    `)
    
    console.log(`   - Index Stock.quantite : ${indexStock.length > 0 ? '✅ Existe' : '❌ Manquant'}`)
    console.log(`   - Index Produit.actif : ${indexProduitActif.length > 0 ? '✅ Existe' : '❌ Manquant'}`)
    console.log(`   - Index Client.actif : ${indexClientActif.length > 0 ? '✅ Existe' : '❌ Manquant'}`)
    console.log('')
    
    // 2. Créer les index manquants
    console.log('🔧 Création des index manquants...')
    
    if (indexStock.length === 0) {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Stock_quantite_idx" ON "Stock"("quantite")`
      console.log('   ✅ Index Stock.quantite créé')
    }
    
    if (indexProduitActif.length === 0) {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Produit_actif_idx" ON "Produit"("actif")`
      console.log('   ✅ Index Produit.actif créé')
    }
    
    if (indexClientActif.length === 0) {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Client_actif_idx" ON "Client"("actif")`
      console.log('   ✅ Index Client.actif créé')
    }
    
    console.log('')
    
    // 3. Optimiser SQLite
    console.log('⚙️  Optimisation SQLite...')
    
    // ANALYZE pour mettre à jour les statistiques
    await prisma.$executeRaw`ANALYZE`
    console.log('   ✅ ANALYZE exécuté')
    
    // Optimisations SQLite
    await prisma.$executeRaw`PRAGMA journal_mode = WAL`
    await prisma.$executeRaw`PRAGMA synchronous = NORMAL`
    await prisma.$executeRaw`PRAGMA cache_size = -64000`
    await prisma.$executeRaw`PRAGMA temp_store = MEMORY`
    console.log('   ✅ Paramètres SQLite optimisés (WAL, cache, etc.)')
    console.log('')
    
    // 4. Test de performance
    console.log('⏱️  Test de performance...')
    
    const start1 = Date.now()
    await prisma.produit.count({ where: { actif: true } })
    const time1 = Date.now() - start1
    
    const start2 = Date.now()
    await prisma.stock.count({ where: { quantite: { gt: 0 } } })
    const time2 = Date.now() - start2
    
    const start3 = Date.now()
    await prisma.produit.groupBy({
      by: ['categorie'],
      where: { actif: true },
      _count: { id: true },
    })
    const time3 = Date.now() - start3
    
    console.log(`   - Count produits actifs : ${time1}ms`)
    console.log(`   - Count stocks > 0 : ${time2}ms`)
    console.log(`   - GroupBy catégories : ${time3}ms`)
    console.log('')
    
    if (time1 < 100 && time2 < 100 && time3 < 200) {
      console.log('✅ Performances excellentes !')
    } else {
      console.log('⚠️  Performances à améliorer - vérifiez les index')
    }
    
    console.log('')
    console.log('✅ Optimisation terminée')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

optimiser()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error)
    process.exit(1)
  })
