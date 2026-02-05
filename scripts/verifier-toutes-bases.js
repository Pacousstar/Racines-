/**
 * Vérifie le nombre de produits dans toutes les bases de données trouvées
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

const bases = [
  { nom: 'Base principale', chemin: path.resolve(__dirname, '..', 'prisma', 'gesticom.db') },
  { nom: 'Base portable data', chemin: path.resolve(__dirname, '..', 'GestiCom-Portable', 'data', 'gesticom.db') },
  { nom: 'Base C:\\', chemin: 'C:\\gesticom_portable_data\\gesticom.db' }
]

async function verifierBase(nom, dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`❌ ${nom}: Fichier non trouvé (${dbPath})`)
    return null
  }

  try {
    const sizeKo = Math.round(fs.statSync(dbPath).size / 1024)
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`
    const prisma = new PrismaClient()
    
    const total = await prisma.produit.count()
    const actifs = await prisma.produit.count({ where: { actif: true } })
    const inactifs = await prisma.produit.count({ where: { actif: false } })
    const stocks = await prisma.stock.count()
    const stocksAvecQte = await prisma.stock.count({ where: { quantiteInitiale: { gt: 0 } } })
    
    await prisma.$disconnect()
    
    return {
      nom,
      chemin: dbPath,
      taille: sizeKo,
      total,
      actifs,
      inactifs,
      stocks,
      stocksAvecQte
    }
  } catch (e) {
    console.log(`❌ ${nom}: Erreur - ${e.message}`)
    return null
  }
}

async function main() {
  console.log('📊 VÉRIFICATION DE TOUTES LES BASES DE DONNÉES')
  console.log('='.repeat(80))
  console.log('')
  
  const resultats = []
  
  for (const base of bases) {
    const resultat = await verifierBase(base.nom, base.chemin)
    if (resultat) {
      resultats.push(resultat)
    }
  }
  
  console.log('')
  console.log('📋 RÉSULTATS :')
  console.log('')
  
  for (const r of resultats) {
    console.log(`📦 ${r.nom}`)
    console.log(`   Chemin: ${r.chemin}`)
    console.log(`   Taille: ${r.taille} Ko`)
    console.log(`   Produits: ${r.total} (${r.actifs} actifs, ${r.inactifs} inactifs)`)
    console.log(`   Stocks: ${r.stocks} (${r.stocksAvecQte} avec quantité initiale > 0)`)
    console.log(`   ${r.total > 3290 ? '⚠️  TROP DE PRODUITS' : r.total === 3290 ? '✅ OK' : r.total < 3290 ? '⚠️  MANQUE DES PRODUITS' : ''}`)
    console.log('')
  }
  
  // Identifier la base avec le plus de produits
  const baseMax = resultats.reduce((max, r) => r.total > max.total ? r : max, resultats[0] || { total: 0 })
  if (baseMax && baseMax.total > 3290) {
    console.log(`⚠️  ATTENTION: La base "${baseMax.nom}" contient ${baseMax.total} produits (objectif: 3290)`)
    console.log(`   Chemin: ${baseMax.chemin}`)
    console.log('')
  }
}

main()
  .then(() => {
    console.log('✨ Vérification terminée')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
