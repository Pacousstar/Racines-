/**
 * Vérifie la base dans prisma/prisma/gesticom.db
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, '..', 'prisma', 'prisma', 'gesticom.db')

if (!fs.existsSync(dbPath)) {
  console.log('❌ Base non trouvée:', dbPath)
  process.exit(1)
}

const sizeKo = Math.round(fs.statSync(dbPath).size / 1024)
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    const total = await prisma.produit.count()
    const actifs = await prisma.produit.count({ where: { actif: true } })
    const inactifs = await prisma.produit.count({ where: { actif: false } })
    const stocks = await prisma.stock.count()
    
    console.log('📊 BASE: prisma/prisma/gesticom.db')
    console.log('='.repeat(80))
    console.log(`Taille: ${sizeKo} Ko`)
    console.log(`Produits: ${total} (${actifs} actifs, ${inactifs} inactifs)`)
    console.log(`Stocks: ${stocks}`)
    console.log('')
    
    if (total > 3290) {
      console.log(`⚠️  TROP DE PRODUITS: ${total} au lieu de 3290`)
      console.log(`📉 À supprimer: ${total - 3290} produits`)
    } else if (total === 3290) {
      console.log('✅ Nombre de produits correct')
    } else {
      console.log(`⚠️  MANQUE DES PRODUITS: ${total} au lieu de 3290`)
    }
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
