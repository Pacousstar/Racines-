/**
 * Corrige les stocks initiaux en relisant le fichier Excel
 * et en mettant à jour les stocks existants avec les valeurs "Stock final"
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx-prototype-pollution-fixed')
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
  console.error('❌ DATABASE_URL manquant.')
  process.exit(1)
}

const prisma = new PrismaClient()
const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

async function main() {
  try {
    console.log('📦 CORRECTION DES STOCKS INITIAUX')
    console.log('='.repeat(80))
    console.log('')
    
    if (!fs.existsSync(FILE_PATH)) {
      console.error(`❌ Fichier introuvable : ${FILE_PATH}`)
      process.exit(1)
    }
    
    // Lire le fichier Excel
    console.log('📖 Lecture du fichier Excel...')
    const workbook = XLSX.readFile(FILE_PATH)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null })
    console.log(`   ✓ ${data.length} lignes lues`)
    console.log('')
    
    // Trouver la colonne "Stock final"
    const premierLigne = data[0]
    const colonnes = Object.keys(premierLigne)
    const colonneStock = colonnes.find(c => 
      c && (
        c.toLowerCase().includes('stock final') ||
        c.toLowerCase().includes('stock finale')
      )
    )
    
    if (!colonneStock) {
      console.error('❌ Colonne "Stock final" non trouvée')
      console.log('📋 Colonnes disponibles :')
      colonnes.forEach(c => console.log(`   - ${c}`))
      process.exit(1)
    }
    
    console.log(`✅ Colonne "Stock final" trouvée : "${colonneStock}"`)
    console.log('')
    
    // Récupérer tous les produits avec leurs codes
    console.log('📋 Récupération des produits...')
    const produits = await prisma.produit.findMany({
      select: { id: true, code: true, designation: true }
    })
    const produitsByCode = new Map()
    produits.forEach(p => {
      produitsByCode.set(p.code.toUpperCase(), p)
    })
    console.log(`   ✓ ${produits.length} produits trouvés`)
    console.log('')
    
    // Récupérer tous les magasins
    console.log('🏪 Récupération des magasins...')
    const magasins = await prisma.magasin.findMany({
      select: { id: true, code: true, nom: true }
    })
    const magasinsByCode = new Map()
    magasins.forEach(m => {
      magasinsByCode.set(m.code.toUpperCase(), m)
    })
    console.log(`   ✓ ${magasins.length} magasins trouvés`)
    console.log('')
    
    // Normaliser les noms de magasins (fusion Danane)
    const nomsMagasins = {
      'DANANE': 'DANANE',
      'DANANÉ': 'DANANE',
      'DANANÉE': 'DANANE',
      'MAGASIN 01': 'MAGASIN 01',
      'MAGASIN 02': 'MAGASIN 02',
      'MAGASIN 03': 'MAGASIN 03',
      'GUIGLO': 'GUIGLO',
      'STOCK 01': 'STOCK 01',
      'STOCK 03': 'STOCK 03',
      'PARE-BRISE': 'PARE-BRISE',
      'PARABRISE': 'PARABRISE',
    }
    
    // Traiter chaque ligne
    console.log('🔄 Mise à jour des stocks...')
    let stocksMisAJour = 0
    let stocksCrees = 0
    let erreurs = 0
    
    for (const row of data) {
      try {
        const designation = String(row['Désignation'] || row['designation'] || '').trim()
        if (!designation) continue
        
        // Trouver le produit par désignation (approximatif)
        const produit = produits.find(p => 
          p.designation.toUpperCase().trim() === designation.toUpperCase().trim()
        )
        
        if (!produit) continue
        
        // Trouver le magasin
        const pointDeVente = String(row['Ref Mag / Stock'] || row['Point de ventes'] || '').trim().toUpperCase()
        if (!pointDeVente || pointDeVente === '-') continue
        
        const magasinNom = nomsMagasins[pointDeVente] || pointDeVente
        const magasin = magasins.find(m => m.code.toUpperCase() === magasinNom)
        
        if (!magasin) continue
        
        // Lire le stock final
        const stockFinal = row[colonneStock]
        const stockInitiale = Math.max(0, Math.floor(Number(stockFinal) || 0))
        
        if (stockInitiale === 0) continue
        
        // Vérifier si le stock existe
        const stockExistant = await prisma.stock.findFirst({
          where: {
            produitId: produit.id,
            magasinId: magasin.id
          }
        })
        
        if (stockExistant) {
          // Mettre à jour
          await prisma.stock.update({
            where: { id: stockExistant.id },
            data: {
              quantite: stockInitiale,
              quantiteInitiale: stockInitiale
            }
          })
          stocksMisAJour++
        } else {
          // Créer
          await prisma.stock.create({
            data: {
              produitId: produit.id,
              magasinId: magasin.id,
              quantite: stockInitiale,
              quantiteInitiale: stockInitiale
            }
          })
          stocksCrees++
        }
      } catch (e) {
        erreurs++
        if (erreurs <= 10) {
          console.warn(`   ⚠️  Erreur ligne ${data.indexOf(row) + 2}: ${e.message}`)
        }
      }
    }
    
    console.log('')
    console.log('✅ CORRECTION TERMINÉE')
    console.log('')
    console.log('📊 Résultats :')
    console.log(`   ✓ Stocks mis à jour : ${stocksMisAJour}`)
    console.log(`   ✓ Stocks créés : ${stocksCrees}`)
    if (erreurs > 0) {
      console.log(`   ⚠️  Erreurs : ${erreurs}`)
    }
    console.log('')
    
    // Vérifier le résultat
    const stocksAvecInitial = await prisma.stock.count({ where: { quantiteInitiale: { gt: 0 } } })
    const totalStockInitial = await prisma.stock.aggregate({
      _sum: { quantiteInitiale: true }
    })
    
    console.log('📊 VÉRIFICATION FINALE :')
    console.log(`   Stocks avec quantité initiale > 0 : ${stocksAvecInitial}`)
    console.log(`   Total quantité initiale : ${totalStockInitial._sum.quantiteInitiale || 0}`)
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('✨ Opération terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error)
    process.exit(1)
  })
