/**
 * Script pour fusionner les produits PARABRISE vers PARE-BRISE
 */

const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

// Charger DATABASE_URL
const envPath = path.join(__dirname, '..', '.env')
const urlPath = path.join(__dirname, '..', '.database_url')

function toFileUrl(p, win32NoThirdSlash) {
  const s = String(p).replace(/\\/g, '/')
  return win32NoThirdSlash ? 'file:' + s : 'file:///' + s
}

let databaseUrl

if (fs.existsSync(urlPath)) {
  databaseUrl = fs.readFileSync(urlPath, 'utf8').trim()
} else if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const m = content.match(/DATABASE_URL\s*=\s*["']?([^"'\n\r]+)["']?/)
  if (m) {
    let dbUrl = m[1].trim()
    if (dbUrl.startsWith('file:./')) {
      const dbRelativePath = dbUrl.replace('file:', '').replace('file:///', '')
      const dbPath = path.resolve(__dirname, '..', dbRelativePath)
      databaseUrl = toFileUrl(dbPath, false)
    } else if (dbUrl.startsWith('./')) {
      const dbPath = path.resolve(__dirname, '..', dbUrl)
      databaseUrl = toFileUrl(dbPath, false)
    } else {
      databaseUrl = dbUrl
    }
  }
}

if (!databaseUrl) {
  const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
  databaseUrl = toFileUrl(dbPath, false)
}

const dbPathResolved = databaseUrl.replace(/^file:\/\/?/, '').replace(/\//g, path.sep)

if (process.platform === 'win32') {
  const candidates = [
    path.join('C:', 'gesticom', 'gesticom.db'),
    path.join('C:', 'Users', 'Public', 'gesticom', 'gesticom.db'),
  ]
  
  let found = false
  for (const fallbackDb of candidates) {
    if (fs.existsSync(fallbackDb)) {
      databaseUrl = toFileUrl(fallbackDb, true)
      found = true
      break
    }
  }
  
  if (!found && dbPathResolved.includes(' ')) {
    const fallbackDb = path.join('C:', 'gesticom', 'gesticom.db')
    if (fs.existsSync(fallbackDb)) {
      databaseUrl = toFileUrl(fallbackDb, true)
    }
  }
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

async function fusionnerParabrise() {
  console.log('🔄 Fusion des produits PARABRISE vers PARE-BRISE')
  console.log('='.repeat(80))
  console.log('')
  
  try {
    // Trouver le magasin PARABRISE
    const magasinParabrise = await prisma.magasin.findUnique({
      where: { code: 'PARABRISE' },
      include: {
        stocks: {
          include: {
            produit: true,
          },
        },
      },
    })
    
    if (!magasinParabrise) {
      console.log('✅ Aucun magasin PARABRISE trouvé')
      return
    }
    
    console.log(`📦 ${magasinParabrise.stocks.length} produit(s) trouvé(s) dans PARABRISE`)
    
    // Trouver le magasin PARE-BRISE
    const magasinPareBrise = await prisma.magasin.findUnique({
      where: { code: 'PARE-BRISE' },
    })
    
    if (!magasinPareBrise) {
      console.error('❌ Magasin PARE-BRISE introuvable')
      return
    }
    
    // Déplacer tous les stocks de PARABRISE vers PARE-BRISE
    let deplaces = 0
    for (const stock of magasinParabrise.stocks) {
      try {
        // Vérifier si le produit a déjà un stock dans PARE-BRISE
        const stockExistant = await prisma.stock.findUnique({
          where: {
            produitId_magasinId: {
              produitId: stock.produitId,
              magasinId: magasinPareBrise.id,
            },
          },
        })
        
        if (stockExistant) {
          // Mettre à jour le stock existant
          await prisma.stock.update({
            where: {
              produitId_magasinId: {
                produitId: stock.produitId,
                magasinId: magasinPareBrise.id,
              },
            },
            data: {
              quantite: stock.quantite + stockExistant.quantite,
              quantiteInitiale: stock.quantiteInitiale + stockExistant.quantiteInitiale,
            },
          })
          // Supprimer l'ancien stock
          await prisma.stock.delete({
            where: {
              produitId_magasinId: {
                produitId: stock.produitId,
                magasinId: magasinParabrise.id,
              },
            },
          })
        } else {
          // Créer le stock dans PARE-BRISE
          await prisma.stock.create({
            data: {
              produitId: stock.produitId,
              magasinId: magasinPareBrise.id,
              quantite: stock.quantite,
              quantiteInitiale: stock.quantiteInitiale,
            },
          })
          // Supprimer l'ancien stock
          await prisma.stock.delete({
            where: {
              produitId_magasinId: {
                produitId: stock.produitId,
                magasinId: magasinParabrise.id,
              },
            },
          })
        }
        deplaces++
        console.log(`   ✓ ${stock.produit.code} déplacé vers PARE-BRISE`)
      } catch (e) {
        console.error(`   ❌ Erreur pour ${stock.produit.code}: ${e.message}`)
      }
    }
    
    console.log('')
    console.log(`✅ ${deplaces} produit(s) déplacé(s) de PARABRISE vers PARE-BRISE`)
    
    // Vérifier qu'il ne reste plus de stocks dans PARABRISE
    const stocksRestants = await prisma.stock.count({
      where: {
        magasinId: magasinParabrise.id,
      },
    })
    
    if (stocksRestants === 0) {
      console.log('✅ Aucun stock restant dans PARABRISE')
      // Optionnel : désactiver le magasin PARABRISE
      await prisma.magasin.update({
        where: { id: magasinParabrise.id },
        data: { actif: false },
      })
      console.log('✅ Magasin PARABRISE désactivé')
    } else {
      console.log(`⚠️  ${stocksRestants} stock(s) restant(s) dans PARABRISE`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la fusion :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fusionnerParabrise()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error)
    process.exit(1)
  })
