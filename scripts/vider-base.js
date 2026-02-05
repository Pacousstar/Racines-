/**
 * Script pour vider complètement la base de données GestiCom
 * ATTENTION : Cette opération est irréversible !
 * 
 * Usage: node scripts/vider-base.js
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Charger DATABASE_URL depuis .env ou .database_url
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

async function viderBase() {
  console.log('⚠️  ATTENTION : Cette opération va SUPPRIMER TOUTES les données !')
  console.log('📁 Base de données :', process.env.DATABASE_URL)
  console.log('')
  
  try {
    console.log('🗑️  Suppression des données...')
    
    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    await prisma.mouvement.deleteMany({})
    console.log('   ✓ Mouvements supprimés')
    
    await prisma.stock.deleteMany({})
    console.log('   ✓ Stocks supprimés')
    
    await prisma.vente.deleteMany({})
    console.log('   ✓ Ventes supprimées')
    
    await prisma.achat.deleteMany({})
    console.log('   ✓ Achats supprimés')
    
    await prisma.depense.deleteMany({})
    console.log('   ✓ Dépenses supprimées')
    
    await prisma.charge.deleteMany({})
    console.log('   ✓ Charges supprimées')
    
    await prisma.produit.deleteMany({})
    console.log('   ✓ Produits supprimés')
    
    await prisma.client.deleteMany({})
    console.log('   ✓ Clients supprimés')
    
    await prisma.fournisseur.deleteMany({})
    console.log('   ✓ Fournisseurs supprimés')
    
    await prisma.magasin.deleteMany({})
    console.log('   ✓ Magasins supprimés')
    
    await prisma.caisse.deleteMany({})
    console.log('   ✓ Caisses supprimées')
    
    await prisma.parametre.deleteMany({})
    console.log('   ✓ Paramètres supprimés')
    
    await prisma.utilisateur.deleteMany({})
    console.log('   ✓ Utilisateurs supprimés')
    
    await prisma.entite.deleteMany({})
    console.log('   ✓ Entités supprimées')
    
    console.log('')
    console.log('✅ Base de données vidée avec succès !')
    console.log('')
    console.log('📝 Prochaines étapes :')
    console.log('   1. Modifiez le schéma Prisma si nécessaire')
    console.log('   2. Exécutez : npx prisma db push')
    console.log('   3. Importez votre nouvelle base de données')
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter
viderBase()
  .then(() => {
    console.log('')
    console.log('✨ Opération terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('')
    console.error('💥 Erreur fatale :', error)
    process.exit(1)
  })
