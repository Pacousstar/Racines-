/**
 * Compare les deux bases de données pour identifier les différences
 */

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

async function verifierBase(dbPath, nom) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath.replace(/\\/g, '/')}`
      }
    }
  })
  
  try {
    const count = await prisma.produit.count()
    const withPrice = await prisma.produit.count({ where: { prixAchat: { gt: 0 } } })
    const withStock = await prisma.stock.count({ where: { quantite: { gt: 0 } } })
    
    const sample = await prisma.produit.findFirst({
      where: { prixAchat: { gt: 0 } },
      select: { code: true, designation: true, prixAchat: true }
    })
    
    const fileInfo = fs.statSync(dbPath)
    
    return {
      nom,
      chemin: dbPath,
      taille: fileInfo.size,
      date: fileInfo.mtime,
      produits: count,
      avecPrix: withPrice,
      avecStock: withStock,
      exemple: sample
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const baseSource = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
  const basePortable = path.resolve(__dirname, '..', 'GestiCom-Portable', 'data', 'gesticom.db')
  
  console.log('=== Comparaison des bases de données ===\n')
  
  const source = await verifierBase(baseSource, 'SOURCE')
  const portable = await verifierBase(basePortable, 'PORTABLE')
  
  console.log('BASE SOURCE:')
  console.log(`  Chemin: ${source.chemin}`)
  console.log(`  Taille: ${source.taille} bytes`)
  console.log(`  Date: ${source.date}`)
  console.log(`  Produits: ${source.produits}`)
  console.log(`  Avec prix: ${source.avecPrix}`)
  console.log(`  Avec stock: ${source.avecStock}`)
  console.log(`  Exemple: ${JSON.stringify(source.exemple)}`)
  
  console.log('\nBASE PORTABLE:')
  console.log(`  Chemin: ${portable.chemin}`)
  console.log(`  Taille: ${portable.taille} bytes`)
  console.log(`  Date: ${portable.date}`)
  console.log(`  Produits: ${portable.produits}`)
  console.log(`  Avec prix: ${portable.avecPrix}`)
  console.log(`  Avec stock: ${portable.avecStock}`)
  console.log(`  Exemple: ${JSON.stringify(portable.exemple)}`)
  
  console.log('\n=== DIFFÉRENCES ===')
  if (source.taille !== portable.taille) {
    console.log(`✗ Tailles différentes: ${source.taille} vs ${portable.taille}`)
  } else {
    console.log(`✓ Tailles identiques: ${source.taille} bytes`)
  }
  
  if (source.produits !== portable.produits) {
    console.log(`✗ Nombre de produits différent: ${source.produits} vs ${portable.produits}`)
  }
  
  if (source.avecPrix !== portable.avecPrix) {
    console.log(`✗ Produits avec prix différents: ${source.avecPrix} vs ${portable.avecPrix}`)
  }
  
  if (source.avecStock !== portable.avecStock) {
    console.log(`✗ Stocks différents: ${source.avecStock} vs ${portable.avecStock}`)
  }
  
  if (source.taille === portable.taille && 
      source.produits === portable.produits && 
      source.avecPrix === portable.avecPrix) {
    console.log('✓ Les bases sont identiques')
  } else {
    console.log('\n⚠️  Les bases sont différentes. Recopiez la base source vers le portable.')
  }
}

main().catch(console.error)
