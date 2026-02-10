/**
 * Script pour importer les produits depuis GestiCom BD FINALE.xlsx
 * 
 * Exigences :
 * - Mettre tous les prix de vente à 0 FCFA
 * - Fusionner les magasins : Danane/Danané → DANANE, PARE-BRISE/PARABRISE → PARE-BRISE
 * - Supprimer les 4 lignes avec caractères spéciaux
 * - Importer tous les produits (même les doublons)
 * - Créer les stocks avec quantités initiales
 * - Confirmer 3289 produits
 * 
 * Usage: node scripts/importer-produits-final.js
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx-prototype-pollution-fixed')
const { PrismaClient } = require('@prisma/client')

// Fonction pour convertir un chemin en file:// URL
function toFileUrl(p, win32NoThirdSlash) {
  const s = String(p).replace(/\\/g, '/')
  return win32NoThirdSlash ? 'file:' + s : 'file:///' + s
}

// Charger DATABASE_URL
const envPath = path.join(__dirname, '..', '.env')
const urlPath = path.join(__dirname, '..', '.database_url')

let databaseUrl

if (fs.existsSync(urlPath)) {
  databaseUrl = fs.readFileSync(urlPath, 'utf8').trim()
} else if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  // Extraire DATABASE_URL avec gestion des guillemets
  const m = content.match(/DATABASE_URL\s*=\s*["']?([^"'\n\r]+)["']?/)
  if (m) {
    let dbUrl = m[1].trim()
    // Si le chemin est relatif, le convertir en absolu
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

// Si toujours pas défini, utiliser le chemin par défaut
if (!databaseUrl) {
  const dbPath = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
  databaseUrl = toFileUrl(dbPath, false)
}

// Toujours essayer d'utiliser un chemin sans espaces pour éviter les problèmes
const dbPathSource = databaseUrl.replace(/^file:\/\/?/, '').replace(/\//g, path.sep)
const dbPathResolved = path.resolve(dbPathSource)

// Gérer les espaces dans le chemin (Windows)
if (process.platform === 'win32') {
  // Toujours utiliser un chemin sans espaces si disponible
  const candidates = [
    path.join('C:', 'gesticom', 'gesticom.db'),
    path.join('C:', 'Users', 'Public', 'gesticom', 'gesticom.db'),
  ]
  
  let found = false
  for (const fallbackDb of candidates) {
    if (fs.existsSync(fallbackDb)) {
      databaseUrl = toFileUrl(fallbackDb, true)
      found = true
      console.log(`   ℹ️  Utilisation de la base sans espaces : ${fallbackDb}`)
      break
    }
  }
  
  if (!found && dbPathResolved.includes(' ')) {
    // Essayer de copier vers un chemin sans espaces
    const fallbackDb = path.join('C:', 'gesticom', 'gesticom.db')
    const fallbackDir = path.dirname(fallbackDb)
    try {
      if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true })
      if (fs.existsSync(dbPathResolved)) {
        fs.copyFileSync(dbPathResolved, fallbackDb)
        databaseUrl = toFileUrl(fallbackDb, true)
        console.log(`   ℹ️  Base copiée vers un chemin sans espaces : ${fallbackDb}`)
      } else {
        // Utiliser le chemin original avec espaces (peut échouer)
        databaseUrl = toFileUrl(dbPathResolved, false)
        console.log(`   ⚠️  Utilisation du chemin avec espaces : ${dbPathResolved}`)
      }
    } catch (e) {
      // Utiliser le chemin original avec espaces (peut échouer)
      databaseUrl = toFileUrl(dbPathResolved, false)
      console.log(`   ⚠️  Impossible de copier, utilisation du chemin avec espaces : ${dbPathResolved}`)
    }
  } else if (!found) {
    databaseUrl = toFileUrl(dbPathResolved, false)
  }
} else {
  databaseUrl = toFileUrl(dbPathResolved, false)
}

process.env.DATABASE_URL = databaseUrl
console.log(`   ℹ️  DATABASE_URL final: ${databaseUrl}`)
console.log('')

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant. Définissez-le dans .env ou .database_url.')
  process.exit(1)
}

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

async function importer() {
  console.log('📦 Import des produits depuis GestiCom BD FINALE.xlsx')
  console.log('='.repeat(80))
  console.log('')
  
  if (!fs.existsSync(FILE_PATH)) {
    console.error('❌ Fichier introuvable :', FILE_PATH)
    process.exit(1)
  }
  
  try {
    // Lire le fichier Excel
    console.log('📖 Lecture du fichier Excel...')
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
    console.log('')
    
    // Vérifier les colonnes
    const firstRow = data[0]
    if (!firstRow) {
      console.error('❌ Aucune donnée trouvée dans le fichier Excel')
      process.exit(1)
    }
    
    const colonnes = Object.keys(firstRow)
    console.log('📋 Colonnes détectées :', colonnes.join(', '))
    console.log('   Note: "Ref Mag / Stock" sera traité comme "Points de vente"')
    console.log('   Note: "Stock final" sera utilisé comme "Stock Initial"')
    console.log('')
    
    // Récupérer ou créer l'entité
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
      console.log('   ✓ Entité créée')
    }
    
    // Traiter les magasins
    console.log('🏪 Traitement des magasins...')
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
    console.log(`   ✓ ${pointsDeVente.length} point(s) de vente unique(s) trouvé(s) :`, pointsDeVente.join(', '))
    
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
        console.log(`   ✓ Magasin créé : ${codeMag} (${nomMag})`)
      }
    }
    
    if (magasinsCrees === 0) {
      console.log('   ✓ Tous les magasins existent déjà')
    }
    console.log('')
    
    // Compter les produits par magasin fusionné
    const produitsParMagasin = new Map()
    data.forEach(row => {
      const pv = row['Ref Mag / Stock'] || row['Ref Mag'] || row['Ref Mag/Stock'] || 
                 row['Points de vente'] || row['points de vente'] || row['Points_de_vente'] ||
                 row['Point de ventes'] || row['Point de vente']
      if (pv && String(pv).trim() !== '-' && String(pv).trim() !== '') {
        const normalise = normaliserMagasin(pv)
        if (normalise) {
          produitsParMagasin.set(normalise, (produitsParMagasin.get(normalise) || 0) + 1)
        }
      }
    })
    
    console.log('📊 Répartition des produits par magasin (après fusion) :')
    produitsParMagasin.forEach((count, mag) => {
      console.log(`   - ${mag}: ${count} produits`)
    })
    
    const totalDanane = (produitsParMagasin.get('DANANE') || 0)
    const totalPareBrise = (produitsParMagasin.get('PARE-BRISE') || 0)
    
    if (totalDanane > 0) {
      console.log(`   ✓ DANANE (fusion Danane + Danané): ${totalDanane} produits`)
    }
    if (totalPareBrise > 0) {
      console.log(`   ✓ PARE-BRISE (fusion PARE-BRISE + PARABRISE): ${totalPareBrise} produits`)
    }
    console.log('')
    
    // Importer les produits
    console.log('📦 Import des produits...')
    let produitsCrees = 0
    let produitsMisAJour = 0
    let stocksCrees = 0
    let doublons = 0
    const codesProduits = new Map() // Pour détecter les doublons
    
    // Compter les doublons avant import
    data.forEach(row => {
      const code = String(row['Code'] || row['code'] || row['Référence'] || row['reference'] || row['Ref'] || '').trim().toUpperCase()
      if (code) {
        codesProduits.set(code, (codesProduits.get(code) || 0) + 1)
      }
    })
    
    const codesEnDoublon = Array.from(codesProduits.entries()).filter(([_, count]) => count > 1)
    if (codesEnDoublon.length > 0) {
      console.log(`   ⚠️  ${codesEnDoublon.length} code(s) produit(s) en doublon détecté(s)`)
      console.log(`   ℹ️  Tous les produits seront importés (même les doublons)`)
    }
    console.log('')
    
    // Préparer les données par lots (batch processing)
    const BATCH_SIZE = 100 // Traiter par lots de 100 produits
    const codesUtilises = new Set() // Cache des codes déjà utilisés dans cette session
    
    // Traiter chaque ligne par lots
    for (let batchStart = 0; batchStart < data.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, data.length)
      const batch = data.slice(batchStart, batchEnd)
      
      console.log(`   ⏳ Traitement du lot ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)} (lignes ${batchStart + 1}-${batchEnd})...`)
      
      // Préparer les données du lot
      const produitsToUpsert = []
      const stocksToUpsert = []
      const codesBatch = new Map() // Code Excel -> Code final pour ce lot
      
      for (let i = 0; i < batch.length; i++) {
        const row = batch[i]
        const globalIndex = batchStart + i
        
        try {
          // Extraire les données
          const codeExcel = String(row['Code'] || row['code'] || row['Référence'] || row['reference'] || row['Ref'] || '').trim().toUpperCase()
          const designation = String(row['Désignation'] || row['Designation'] || row['designation'] || '').trim()
          
          if (!designation) {
            continue // Ignorer les lignes sans désignation
          }
          
          // Générer un code si manquant (basé sur l'index pour éviter les conflits)
          let code = codeExcel
          if (!code) {
            code = `PROD${String(globalIndex + 1).padStart(6, '0')}`
          }
          
          // Gérer les doublons : ajouter un suffixe unique
          let codeFinal = code
          let suffixe = 1
          while (codesUtilises.has(codeFinal) || codesBatch.has(codeFinal)) {
            codeFinal = `${code}_${suffixe}`
            suffixe++
            doublons++
          }
          codesUtilises.add(codeFinal)
          codesBatch.set(codeExcel || code, codeFinal)
          
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
          
          // Ajouter le produit au lot
          produitsToUpsert.push({
            code: codeFinal,
            designation,
            categorie,
            prixAchat,
            prixVente,
            seuilMin,
            pvNormalise,
            stockInitial,
          })
        } catch (error) {
          console.error(`   ❌ Erreur préparation ligne ${globalIndex + 2}:`, error.message)
        }
      }
      
      // Traiter le lot dans une transaction
      try {
        await prisma.$transaction(async (tx) => {
          // Créer/mettre à jour les produits
          for (const produitData of produitsToUpsert) {
            try {
              const produit = await tx.produit.upsert({
                where: { code: produitData.code },
                update: {
                  designation: produitData.designation,
                  categorie: produitData.categorie,
                  prixAchat: produitData.prixAchat,
                  prixVente: produitData.prixVente, // Toujours 0
                  seuilMin: produitData.seuilMin,
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
              
              // Compter créé vs mis à jour
              const existing = await tx.produit.findUnique({ where: { code: produitData.code } })
              if (existing && existing.createdAt.getTime() !== existing.updatedAt.getTime()) {
                produitsMisAJour++
              } else {
                produitsCrees++
              }
              
              // Créer le stock UNIQUEMENT dans le magasin spécifié (pas automatiquement dans les autres)
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
              console.error(`   ⚠️  Erreur produit ${produitData.code}: ${e.message}`)
            }
          }
        }, {
          timeout: 30000, // 30 secondes par lot
        })
      } catch (error) {
        console.error(`   ❌ Erreur transaction lot ${Math.floor(batchStart / BATCH_SIZE) + 1}:`, error.message)
        // Continuer avec le lot suivant même en cas d'erreur
      }
    }
    
    console.log('')
    console.log('✅ Import terminé !')
    console.log('')
    console.log('📊 Statistiques :')
    console.log(`   - Produits créés : ${produitsCrees}`)
    console.log(`   - Produits mis à jour : ${produitsMisAJour}`)
    console.log(`   - Stocks créés/mis à jour : ${stocksCrees}`)
    console.log(`   - Doublons gérés : ${doublons}`)
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
    if (produitsDanane >= 650 && produitsDanane <= 690) {
      console.log(`   ✅ Confirmation : environ ${produitsDanane} produits dans DANANE (attendu ~670)`)
    } else {
      console.log(`   ⚠️  Attendu ~670 produits, trouvé : ${produitsDanane}`)
    }
    
    console.log(`   - PARE-BRISE (fusion PARE-BRISE + PARABRISE) : ${produitsPareBrise} produits`)
    if (produitsPareBrise >= 50 && produitsPareBrise <= 60) {
      console.log(`   ✅ Confirmation : environ ${produitsPareBrise} produits dans PARE-BRISE (attendu ~55)`)
    } else {
      console.log(`   ⚠️  Attendu ~55 produits, trouvé : ${produitsPareBrise}`)
    }
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import :', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter l'import
importer()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error)
    process.exit(1)
  })
