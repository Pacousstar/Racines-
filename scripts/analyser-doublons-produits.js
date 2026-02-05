/**
 * Script pour analyser les doublons de produits
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Compter les produits par code
    const produits = await prisma.produit.findMany({
      where: { actif: true },
      select: { id: true, code: true, designation: true }
    })
    
    const codesMap = new Map()
    produits.forEach(p => {
      const count = codesMap.get(p.code) || 0
      codesMap.set(p.code, count + 1)
    })
    
    const codesUniques = Array.from(codesMap.keys())
    const codesEnDoublon = Array.from(codesMap.entries()).filter(([_, count]) => count > 1)
    
    console.log('📊 ANALYSE DES PRODUITS')
    console.log('='.repeat(80))
    console.log(`Total produits (actifs) : ${produits.length}`)
    console.log(`Codes uniques : ${codesUniques.length}`)
    console.log(`Codes en doublon : ${codesEnDoublon.length}`)
    console.log('')
    
    if (codesEnDoublon.length > 0) {
      console.log('⚠️  Codes en doublon (premiers 20) :')
      codesEnDoublon.slice(0, 20).forEach(([code, count]) => {
        console.log(`   ${code}: ${count} fois`)
      })
      if (codesEnDoublon.length > 20) {
        console.log(`   ... et ${codesEnDoublon.length - 20} autres`)
      }
    }
    
    // Compter les produits par désignation
    const designationsMap = new Map()
    produits.forEach(p => {
      const des = p.designation.trim().toUpperCase()
      const count = designationsMap.get(des) || 0
      designationsMap.set(des, count + 1)
    })
    
    const designationsUniques = Array.from(designationsMap.keys())
    const designationsEnDoublon = Array.from(designationsMap.entries()).filter(([_, count]) => count > 1)
    
    console.log('')
    console.log(`Désignations uniques : ${designationsUniques.length}`)
    console.log(`Désignations en doublon : ${designationsEnDoublon.length}`)
    
    // Compter combien de produits ont la même désignation mais des codes différents
    const produitsParDesignation = new Map()
    produits.forEach(p => {
      const des = p.designation.trim().toUpperCase()
      if (!produitsParDesignation.has(des)) {
        produitsParDesignation.set(des, [])
      }
      produitsParDesignation.get(des).push(p.code)
    })
    
    const designationsAvecCodesDifferents = Array.from(produitsParDesignation.entries())
      .filter(([_, codes]) => codes.length > 1 && new Set(codes).size > 1)
    
    console.log(`Désignations avec codes différents : ${designationsAvecCodesDifferents.length}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
