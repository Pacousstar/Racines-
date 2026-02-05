/**
 * Réinitialise tous les prix de vente des produits à 0
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

// Base principale utilisée par l'application (définie dans .env)
const basePrincipale = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')

// Liste des bases à traiter (seulement la base principale par défaut)
const bases = [
  { nom: 'Base principale', chemin: basePrincipale }
]

async function reinitialiserPrixVente(nom, dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`❌ ${nom}: Fichier non trouvé (${dbPath})`)
    return null
  }

  try {
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`
    const prisma = new PrismaClient()
    
    // Compter les produits avec prix de vente non nul
    const produitsAvecPrix = await prisma.produit.count({
      where: {
        prixVente: { not: null }
      }
    })
    
    const totalProduits = await prisma.produit.count()
    
    console.log(`📦 ${nom}`)
    console.log(`   Produits totaux : ${totalProduits}`)
    console.log(`   Produits avec prix de vente non nul : ${produitsAvecPrix}`)
    
    if (produitsAvecPrix === 0) {
      console.log(`   ✅ Aucun prix de vente à réinitialiser`)
      await prisma.$disconnect()
      return { nom, total: totalProduits, misAJour: 0 }
    }
    
    // Mettre tous les prix de vente à 0
    const resultat = await prisma.produit.updateMany({
      where: {
        prixVente: { not: null }
      },
      data: {
        prixVente: 0
      }
    })
    
    console.log(`   ✅ ${resultat.count} prix(s) de vente réinitialisé(s) à 0`)
    
    // Vérification
    const produitsAvecPrixApres = await prisma.produit.count({
      where: {
        prixVente: { not: null, not: 0 }
      }
    })
    
    const produitsAvecPrixZero = await prisma.produit.count({
      where: {
        prixVente: 0
      }
    })
    
    console.log(`   📊 Après réinitialisation :`)
    console.log(`      - Produits avec prix de vente = 0 : ${produitsAvecPrixZero}`)
    console.log(`      - Produits avec prix de vente ≠ 0 : ${produitsAvecPrixApres}`)
    console.log('')
    
    await prisma.$disconnect()
    
    return {
      nom,
      total: totalProduits,
      misAJour: resultat.count
    }
  } catch (e) {
    console.log(`   ❌ Erreur : ${e.message}`)
    console.log('')
    return null
  }
}

async function main() {
  console.log('🔄 RÉINITIALISATION DES PRIX DE VENTE')
  console.log('='.repeat(80))
  console.log('')
  console.log('⚠️  ATTENTION : Tous les prix de vente seront mis à 0')
  console.log('')
  
  const resultats = []
  
  for (const base of bases) {
    const resultat = await reinitialiserPrixVente(base.nom, base.chemin)
    if (resultat) {
      resultats.push(resultat)
    }
  }
  
  console.log('')
  console.log('📋 RÉSUMÉ :')
  console.log('')
  
  for (const r of resultats) {
    console.log(`   ${r.nom}: ${r.misAJour} prix(s) réinitialisé(s) sur ${r.total} produit(s)`)
  }
  
  if (resultats.length > 0) {
    const resultat = resultats[0]
    console.log('')
    console.log(`✨ ${resultat.misAJour} prix(s) de vente réinitialisé(s) à 0 dans la base principale`)
    console.log('')
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Erreur fatale :', e)
    process.exit(1)
  })
