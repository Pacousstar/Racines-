/**
 * Vérifie le nombre exact de produits dans la base
 */

const { PrismaClient } = require('@prisma/client')

// FORCER l'utilisation de la base source
const path = require('path')
const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

async function main() {
  try {
    const total = await prisma.produit.count()
    const actifs = await prisma.produit.count({ where: { actif: true } })
    const inactifs = await prisma.produit.count({ where: { actif: false } })
    
    console.log('📊 NOMBRE DE PRODUITS DANS LA BASE')
    console.log('='.repeat(80))
    console.log(`Total produits : ${total}`)
    console.log(`   - Actifs : ${actifs}`)
    console.log(`   - Inactifs : ${inactifs}`)
    console.log(`🎯 Objectif : 3290 produits`)
    console.log(`📉 À supprimer : ${total - 3290} produits`)
    console.log('')
    
    if (total > 3290) {
      console.log('⚠️  Il y a trop de produits. Exécutez le script de nettoyage.')
    } else if (total === 3290) {
      console.log('✅ Le nombre de produits est correct.')
    } else {
      console.log(`⚠️  Il manque ${3290 - total} produits.`)
    }
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
