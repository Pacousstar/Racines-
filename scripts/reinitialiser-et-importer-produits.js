/**
 * Script pour réinitialiser la base et réimporter UNIQUEMENT les 3289 produits du fichier Excel
 * 
 * Règles strictes :
 * 1. Exactement 3289 produits (pas de doublons)
 * 2. Tous les prix de vente à 0 FCFA
 * 3. Chaque produit dans UN SEUL magasin (celui spécifié dans Excel)
 * 4. Fusion Danane + Danané → DANANE
 * 5. Fusion PARE-BRISE + PARABRISE → PARE-BRISE
 * 6. Supprimer les 4 lignes avec caractères spéciaux
 * 7. Colonne "Ref Mag / Stock" = "Points de vente"
 * 8. Stock initial depuis "Stock final"
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx-prototype-pollution-fixed')
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

const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

// Lignes à supprimer (caractères spéciaux)
const LIGNES_A_SUPPRIMER = [
  '???????????????????????????????????????',
  '§/.???????????????????????',
  '?????????????????????????????????????????????????',
  '!!!!!!!'
]

/**
 * Normalise le nom du magasin et fusionne les variantes
 */
function normaliserMagasin(nom) {
  if (!nom) return null
  const n = String(nom).trim().toUpperCase()
  
  // Fusion Danane/Danané → DANANE
  if (n.includes('DANANE') || n.includes('DANANÉ')) {
    return 'DANANE'
  }
  
  // Fusion PARE-BRISE/PARABRISE → PARE-BRISE
  if (n.includes('PARE') && n.includes('BRISE')) {
    return 'PARE-BRISE'
  }
  if (n.includes('PARABR')) {
    return 'PARE-BRISE'
  }
  
  // Autres magasins
  if (n.includes('MAGASIN') && (n.includes('01') || n.includes('1'))) return 'MAG01'
  if (n.includes('MAGASIN') && (n.includes('02') || n.includes('2'))) return 'MAG02'
  if (n.includes('MAGASIN') && (n.includes('03') || n.includes('3'))) return 'MAG03'
  if (n.includes('STOCK') && (n.includes('01') || n.includes('1'))) return 'STOCK01'
  if (n.includes('STOCK') && (n.includes('03') || n.includes('3'))) return 'STOCK03'
  if (n.includes('GUIGLO')) return 'GUIGLO'
  
  return n || null
}

/**
 * Vérifie si une ligne doit être supprimée
 */
function doitSupprimerLigne(designation) {
  if (!designation) return false
  const des = String(designation).trim()
  return LIGNES_A_SUPPRIMER.some(pattern => des === pattern || des.includes(pattern))
}

async function reinitialiserEtImporter() {
  console.log('🔄 Réinitialisation et import des produits')
  console.log('='.repeat(80))
  console.log('')
  
  if (!fs.existsSync(FILE_PATH)) {
    console.error('❌ Fichier introuvable :', FILE_PATH)
    process.exit(1)
  }
  
  try {
    // ÉTAPE 1 : Vider tous les produits et stocks existants
    console.log('🗑️  Étape 1 : Suppression de tous les produits et stocks existants...')
    
    const countStocks = await prisma.stock.count()
    const countProduits = await prisma.produit.count()
    
    console.log(`   - ${countStocks} stock(s) à supprimer`)
    console.log(`   - ${countProduits} produit(s) à supprimer`)
    
    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    // Désactiver temporairement les contraintes de clés étrangères
    console.log('   - Désactivation temporaire des contraintes...')
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF')
    
    // 1. Supprimer les lignes de ventes et achats qui référencent les produits
    console.log('   - Suppression des lignes de ventes...')
    await prisma.venteLigne.deleteMany({})
    console.log('   ✅ Lignes de ventes supprimées')
    
    console.log('   - Suppression des lignes d\'achats...')
    await prisma.achatLigne.deleteMany({})
    console.log('   ✅ Lignes d\'achats supprimées')
    
    // 2. Supprimer les mouvements
    console.log('   - Suppression des mouvements...')
    await prisma.mouvement.deleteMany({})
    console.log('   ✅ Mouvements supprimés')
    
    // 3. Supprimer tous les stocks
    console.log('   - Suppression des stocks...')
    await prisma.stock.deleteMany({})
    console.log('   ✅ Tous les stocks supprimés')
    
    // 4. Supprimer tous les produits
    console.log('   - Suppression des produits...')
    await prisma.produit.deleteMany({})
    console.log('   ✅ Tous les produits supprimés')
    
    // Réactiver les contraintes
    console.log('   - Réactivation des contraintes...')
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
    console.log('')
    
    // ÉTAPE 2 : Lire le fichier Excel
    console.log('📖 Étape 2 : Lecture du fichier Excel...')
    const workbook = XLSX.readFile(FILE_PATH)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    let data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null })
    
    console.log(`   ✓ ${data.length} lignes trouvées dans l'onglet "${sheetName}"`)
    
    // Supprimer les 4 lignes avec caractères spéciaux
    const lignesAvantFiltre = data.length
    data = data.filter(row => {
      const des = String(row['Désignation'] || row['Designation'] || '').trim()
      return !doitSupprimerLigne(des)
    })
    const lignesSupprimees = lignesAvantFiltre - data.length
    
    if (lignesSupprimees > 0) {
      console.log(`   ⚠️  ${lignesSupprimees} ligne(s) avec caractères spéciaux supprimée(s)`)
    }
    
    console.log(`   ✅ ${data.length} lignes valides après filtrage`)
    
    if (data.length !== 3289) {
      console.log(`   ⚠️  ATTENTION : ${data.length} lignes au lieu de 3289 attendues`)
    }
    console.log('')
    
    // ÉTAPE 3 : Préparer les magasins
    console.log('🏪 Étape 3 : Préparation des magasins...')
    let entite = await prisma.entite.findFirst()
    if (!entite) {
      entite = await prisma.entite.create({
        data: {
          code: 'ENT001',
          nom: 'Entité principale',
          type: 'MAISON_MERE',
          localisation: 'Localisation principale',
          active: true,
        },
      })
    }
    
    const magasinsExistants = await prisma.magasin.findMany({
      where: { actif: true },
      select: { id: true, code: true, nom: true },
    })
    
    const magasinMap = new Map()
    for (const m of magasinsExistants) {
      magasinMap.set(m.code.toUpperCase(), m.id)
    }
    
    // Extraire les points de vente uniques depuis les données
    const pointsDeVenteSet = new Set()
    data.forEach(row => {
      const pv = row['Ref Mag / Stock'] || row['Ref Mag'] || row['Ref Mag/Stock'] || 
                 row['Points de vente'] || row['points de vente'] || row['Points_de_vente'] ||
                 row['Point de ventes'] || row['Point de vente']
      
      if (pv && String(pv).trim() !== '-' && String(pv).trim() !== '') {
        const normalise = normaliserMagasin(pv)
        if (normalise) {
          pointsDeVenteSet.add(normalise)
        }
      }
    })
    
    const pointsDeVente = Array.from(pointsDeVenteSet)
    console.log(`   ✓ ${pointsDeVente.length} point(s) de vente unique(s) :`, pointsDeVente.join(', '))
    
    // Créer les magasins manquants
    const nomsMagasins = {
      'MAG01': 'Magasin 01',
      'MAG02': 'Magasin 02',
      'MAG03': 'Magasin 03',
      'STOCK01': 'Stock 01',
      'STOCK03': 'Stock 03',
      'DANANE': 'Danané',
      'GUIGLO': 'Guiglo',
      'PARE-BRISE': 'Pare-brise',
    }
    
    let magasinsCrees = 0
    for (const codeMag of pointsDeVente) {
      if (!magasinMap.has(codeMag)) {
        const nomMag = nomsMagasins[codeMag] || codeMag
        const magasin = await prisma.magasin.create({
          data: {
            code: codeMag,
            nom: nomMag,
            localisation: nomMag,
            entiteId: entite.id,
            actif: true,
          },
        })
        magasinMap.set(codeMag, magasin.id)
        magasinsCrees++
      }
    }
    
    if (magasinsCrees === 0) {
      console.log('   ✅ Tous les magasins existent déjà')
    } else {
      console.log(`   ✅ ${magasinsCrees} magasin(s) créé(s)`)
    }
    console.log('')
    
    // ÉTAPE 4 : Importer les produits par lots (sans doublons)
    console.log('📦 Étape 4 : Import des produits (3289 produits attendus)...')
    
    let produitsCrees = 0
    let stocksCrees = 0
    const codesUtilises = new Set() // Pour éviter les doublons
    const BATCH_SIZE = 100 // Traiter par lots de 100 produits
    
    // Préparer toutes les données d'abord
    const produitsData = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      
      const codeExcel = String(row['Code'] || row['code'] || row['Référence'] || row['reference'] || row['Ref'] || '').trim().toUpperCase()
      const designation = String(row['Désignation'] || row['Designation'] || row['designation'] || '').trim()
      
      if (!designation) {
        continue // Ignorer les lignes sans désignation
      }
      
      // Générer un code si manquant
      let code = codeExcel
      if (!code) {
        code = `PROD${String(i + 1).padStart(6, '0')}`
      }
      
      // Vérifier les doublons - si le code existe déjà, ajouter un suffixe
      let codeFinal = code
      let suffixe = 1
      while (codesUtilises.has(codeFinal)) {
        codeFinal = `${code}_${suffixe}`
        suffixe++
      }
      codesUtilises.add(codeFinal)
      
      // Extraire les autres données
      const prixAchat = row['Prix d\'achat (FCFA)'] != null || row['Prix d\'achat'] != null || row['PrixAchat'] != null
        ? Number(row['Prix d\'achat (FCFA)'] || row['Prix d\'achat'] || row['PrixAchat']) || null
        : null
      const prixVente = 0 // TOUS LES PRIX DE VENTE À 0 FCFA
      const categorie = String(row['Catégorie'] || row['Categorie'] || row['categorie'] || 'DIVERS').trim() || 'DIVERS'
      const seuilMin = Math.max(0, Number(row['Seuil Min'] || row['SeuilMin'] || row['seuil_min'] || 5) || 5)
      
      // Stock initial
      const stockFinal = row['Stock final'] != null || row['Stock Final'] != null || row['StockFinal'] != null
        ? Number(row['Stock final'] || row['Stock Final'] || row['StockFinal']) || 0
        : 0
      const stockInitial = Math.max(0, Math.floor(stockFinal))
      
      // Point de vente (magasin) - UN SEUL MAGASIN PAR PRODUIT
      const pvRaw = row['Ref Mag / Stock'] || row['Ref Mag'] || row['Ref Mag/Stock'] || 
                    row['Points de vente'] || row['points de vente'] || row['Points_de_vente'] ||
                    row['Point de ventes'] || row['Point de vente']
      const pvNormalise = normaliserMagasin(pvRaw)
      
      produitsData.push({
        code: codeFinal,
        designation,
        categorie,
        prixAchat,
        prixVente,
        seuilMin,
        pvNormalise,
        stockInitial,
      })
    }
    
    // Traiter par lots dans des transactions
    for (let batchStart = 0; batchStart < produitsData.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, produitsData.length)
      const batch = produitsData.slice(batchStart, batchEnd)
      
      console.log(`   ⏳ Traitement du lot ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(produitsData.length / BATCH_SIZE)} (lignes ${batchStart + 1}-${batchEnd})...`)
      
      try {
        await prisma.$transaction(async (tx) => {
          for (const produitData of batch) {
            try {
              // Utiliser upsert pour gérer les doublons
              const produit = await tx.produit.upsert({
                where: { code: produitData.code },
                update: {
                  designation: produitData.designation,
                  categorie: produitData.categorie,
                  prixAchat: produitData.prixAchat,
                  prixVente: produitData.prixVente, // Toujours 0
                  seuilMin: produitData.seuilMin,
                  actif: true,
                },
                create: {
                  code: produitData.code,
                  designation: produitData.designation,
                  categorie: produitData.categorie,
                  prixAchat: produitData.prixAchat,
                  prixVente: produitData.prixVente, // Toujours 0
                  seuilMin: produitData.seuilMin,
                  actif: true,
                },
              })
              
              // Compter seulement les créations
              const existing = await tx.produit.findUnique({ where: { code: produitData.code } })
              if (existing && existing.createdAt.getTime() === existing.updatedAt.getTime()) {
                produitsCrees++
              }
              
              // Créer le stock UNIQUEMENT dans le magasin spécifié
              if (produitData.pvNormalise) {
                const magasinId = magasinMap.get(produitData.pvNormalise)
                if (magasinId) {
                  await tx.stock.upsert({
                    where: {
                      produitId_magasinId: {
                        produitId: produit.id,
                        magasinId: magasinId,
                      },
                    },
                    update: {
                      quantite: produitData.stockInitial,
                      quantiteInitiale: produitData.stockInitial,
                    },
                    create: {
                      produitId: produit.id,
                      magasinId: magasinId,
                      quantite: produitData.stockInitial,
                      quantiteInitiale: produitData.stockInitial,
                    },
                  })
                  stocksCrees++
                }
              }
            } catch (e) {
              // Ignorer les erreurs de contrainte unique (doublons dans le fichier)
              console.log(`   ⚠️  Produit ${produitData.code} ignoré (doublon)`)
            }
          }
        }, {
          timeout: 30000, // 30 secondes par lot
        })
      } catch (error) {
        console.error(`   ❌ Erreur transaction lot ${Math.floor(batchStart / BATCH_SIZE) + 1}:`, error.message)
        // Continuer avec le lot suivant
      }
    }
    
    console.log('')
    console.log('✅ Import terminé !')
    console.log('')
    console.log('📊 Statistiques :')
    console.log(`   - Produits créés : ${produitsCrees}`)
    console.log(`   - Stocks créés : ${stocksCrees}`)
    console.log('')
    
    // Vérifier le nombre total de produits
    const totalProduits = await prisma.produit.count()
    console.log(`   - Total produits en base : ${totalProduits}`)
    
    if (totalProduits === 3289) {
      console.log('   ✅ Confirmation : 3289 produits en base (comme attendu)')
    } else {
      console.log(`   ⚠️  Attendu : 3289 produits, trouvé : ${totalProduits}`)
    }
    console.log('')
    
    // Vérifier les magasins fusionnés
    const produitsDanane = await prisma.stock.count({
      where: {
        magasin: {
          code: 'DANANE',
        },
      },
    })
    const produitsPareBrise = await prisma.stock.count({
      where: {
        magasin: {
          code: 'PARE-BRISE',
        },
      },
    })
    
    console.log('📊 Vérification des fusions :')
    console.log(`   - DANANE (fusion Danane + Danané) : ${produitsDanane} produits`)
    console.log(`   - PARE-BRISE (fusion PARE-BRISE + PARABRISE) : ${produitsPareBrise} produits`)
    console.log('')
    
    // Vérifier que tous les produits ont un prix de vente à 0
    const produitsAvecPrixVente = await prisma.produit.count({
      where: {
        prixVente: {
          not: 0,
        },
      },
    })
    
    if (produitsAvecPrixVente === 0) {
      console.log('✅ Tous les prix de vente sont à 0 FCFA')
    } else {
      console.log(`⚠️  ${produitsAvecPrixVente} produit(s) avec prix de vente ≠ 0`)
    }
    console.log('')
    
    // Vérifier que chaque produit est dans UN SEUL magasin
    const produitsMultiMagasins = await prisma.produit.findMany({
      where: {
        actif: true,
        stocks: {
          some: {},
        },
      },
      include: {
        stocks: true,
      },
    })
    
    const produitsAvecPlusieursMagasins = produitsMultiMagasins.filter(p => p.stocks.length > 1)
    
    if (produitsAvecPlusieursMagasins.length === 0) {
      console.log('✅ Tous les produits sont dans UN SEUL magasin (règle respectée)')
    } else {
      console.log(`⚠️  ${produitsAvecPlusieursMagasins.length} produit(s) dans plusieurs magasins`)
    }
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter
reinitialiserEtImporter()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error)
    process.exit(1)
  })
