/**
 * Script pour importer la nouvelle base de données depuis GestiCom BD FINALE.xlsx
 * 
 * Fonctionnalités :
 * - Génère automatiquement les catégories à partir des désignations
 * - Génère les codes produits automatiquement par catégorie
 * - Associe les produits aux magasins (Ref Mag / Stock)
 * - Crée les stocks avec quantité initiale depuis "Stock final"
 * - PRÉSERVE les stocks existants (ne les écrase pas) pour garder les enregistrements de production
 * 
 * Usage: node scripts/importer-nouvelle-bd.js
 * 
 * Comportement stocks :
 * - Si un stock existe déjà pour un produit × magasin, il est PRÉSERVÉ (non modifié)
 * - Seuls les stocks manquants sont créés avec les valeurs de l'Excel
 * - Pour forcer l'écrasement des stocks : définir PRESERVE_STOCKS=false dans l'environnement
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
  console.error('❌ DATABASE_URL manquant. Définissez-le dans .env ou .database_url.')
  process.exit(1)
}

const prisma = new PrismaClient()
const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

// Option : préserver les stocks existants (par défaut: true pour production)
// Si PRESERVE_STOCKS=false, les stocks existants seront écrasés par les valeurs Excel
const PRESERVE_STOCKS = process.env.PRESERVE_STOCKS !== 'false'

/**
 * Extrait la catégorie probable à partir de la désignation
 * Basé sur l'analyse des 3289 produits
 */
function extraireCategorie(designation) {
  const des = designation.toUpperCase().trim()
  const mots = des.split(/\s+/).filter(m => m.length > 0)
  const premierMot = mots[0] || ''
  const deuxPremiersMots = mots.slice(0, 2).join(' ')
  
  // Catégories basées sur l'analyse réelle des données
  const categories = {
    // MÉCANIQUE AUTO
    'MECANIQUE_AUTO': [
      'ROULAMENT', 'ROULEMENT', 'FILTRE', 'JOINT', 'JEU', 'JEUX', 'CYLINDRE', 'COUSINET', 
      'BRIDE', 'DISQUE', 'BOUCHON', 'POMPE', 'SEGMENT', 'RESSORT', 'CROISON', 'PATTE', 
      'CARDANT', 'BUTIER', 'LARBRE', 'CRIQUE', 'AMORTISSEUR', 'EMBRAYAGE', 'CULASSE', 
      'VILEBREQUIN', 'PISTON', 'PALIER', 'GARNITURE', 'SEGUIN', 'BAGUE', 'SUSPENSION', 
      'FREIN', 'PLAQUE', 'BOITE', 'TRANSMISSION', 'ARBRE', 'VILEBREQUIN'
    ],
    // ÉLECTRICITÉ AUTO
    'ELECTRICITE_AUTO': [
      'DELCO', 'PLATEAU', 'ALTERNATEUR', 'BOUGIE', 'CABLE', 'FUSIBLE', 'AMPOULE', 
      'INTERRUPTEUR', 'PRISE', 'DOUILLE', 'LAMPE', 'PHARE', 'FEU', 'CONTACTEUR', 
      'RELAIS', 'BOBINE', 'MOTEUR', 'VENTILATEUR', 'ELECTRIQUE', 'ALARM', 'ALARME',
      'ACCELERATEUR', 'RETROVISEUR', 'AMBOUR', 'AMBOUT'
    ],
    // CARROSSERIE
    'CARROSSERIE': [
      'PORTE', 'CAPOT', 'AILE', 'PARECHOC', 'GRILLE', 'VITRE', 'MIRROIR', 'POIGNEE', 
      'SERRURE', 'HINGE', 'CHARNIERE', 'HABILLAGE', 'FAUTEUILLE', 'RETROVISEUR'
    ],
    // QUINCAILLERIE
    'QUINCAILLERIE': [
      'VIS', 'ECROU', 'BOULON', 'RIVET', 'CLOU', 'AGRAFE', 'CROCHET', 'CHAINE', 
      'CORDE', 'FICELLE', 'CLE', 'CLÉ', 'NECESSAIRE'
    ],
    // HYDRAULIQUE
    'HYDRAULIQUE': [
      'POMPE', 'TUYAU', 'FLEXIBLE', 'RACCORD', 'COLLIER', 'VALVE', 'VANNE', 
      'RESERVOIR', 'RADIATEUR', 'CALORIFUGE'
    ],
    // PEINTURE
    'PEINTURE': [
      'PEINTURE', 'VERNIS', 'PRIMER', 'APPRE', 'DILUANT', 'SOLVANT', 'BOMBE'
    ],
    // DIVERS
    'DIVERS': [
      'ACCORDÉON', 'ACCORDEON', 'APPAREIL'
    ]
  }
  
  // Vérifier les deux premiers mots d'abord (plus précis)
  for (const [cat, mots] of Object.entries(categories)) {
    for (const mot of mots) {
      if (deuxPremiersMots.includes(mot) || des.includes(mot)) {
        return cat
      }
    }
  }
  
  // Vérifier le premier mot
  for (const [cat, mots] of Object.entries(categories)) {
    for (const mot of mots) {
      if (premierMot === mot || premierMot.startsWith(mot) || mot.startsWith(premierMot)) {
        return cat
      }
    }
  }
  
  // Patterns spécifiques détectés
  if (des.includes('FILTRE A') || des.includes('FILTRE DE')) {
    return 'MECANIQUE_AUTO'
  }
  if (des.includes('JEU DE') || des.includes('JEUX DE')) {
    return 'MECANIQUE_AUTO'
  }
  if (des.includes('JOINT SPIRE') || des.includes('JOINT DE')) {
    return 'MECANIQUE_AUTO'
  }
  if (des.includes('CABLE D') || des.includes('CABLE DE')) {
    return 'ELECTRICITE_AUTO'
  }
  if (des.includes('COUSINET DE')) {
    return 'MECANIQUE_AUTO'
  }
  if (des.includes('DISQUE D\'EMBRAYAGE') || des.includes('CYLINDRE D\'EMBRAYAGE')) {
    return 'MECANIQUE_AUTO'
  }
  if (des.includes('AMBOUR') || des.includes('AMBOUT')) {
    return 'ELECTRICITE_AUTO'
  }
  
  // Par défaut, utiliser les 4 premiers caractères du premier mot
  return premierMot.substring(0, 4).toUpperCase().replace(/\s/g, '') || 'DIVERS'
}


/**
 * Normalise le nom du magasin selon la liste officielle
 */
function normaliserMagasin(nom) {
  if (!nom) return null
  
  const n = String(nom).trim().toUpperCase()
  
  // Liste officielle des points de vente
  const mappings = {
    // Magasin 01
    'MAGASIN 01': 'MAG01',
    'MAGASIN 1': 'MAG01',
    'MAG01': 'MAG01',
    'MAGASIN01': 'MAG01',
    // Magasin 02
    'MAGASIN 02': 'MAG02',
    'MAGASIN 2': 'MAG02',
    'MAG02': 'MAG02',
    'MAGASIN02': 'MAG02',
    // Magasin 03
    'MAGASIN 03': 'MAG03',
    'MAGASIN 3': 'MAG03',
    'MAG03': 'MAG03',
    'MAGASIN03': 'MAG03',
    // Stock 01
    'STOCK 01': 'STOCK01',
    'STOCK 1': 'STOCK01',
    'STOCK01': 'STOCK01',
    'STOCK1': 'STOCK01',
    // Stock 03
    'STOCK 03': 'STOCK03',
    'STOCK 3': 'STOCK03',
    'STOCK03': 'STOCK03',
    'STOCK3': 'STOCK03',
    // Danane / Danané
    'DANANE': 'DANANE',
    'DANANÉ': 'DANANE',
    'DANANE': 'DANANE',
    // Guiglo
    'GUIGLO': 'GUIGLO',
    // PARE-BRISE
    'PARE-BRISE': 'PARE-BRISE',
    'PAREBRISE': 'PARE-BRISE',
    'PARE-B': 'PARE-BRISE',
    'PAREB': 'PARE-BRISE',
    // PARABRISE
    'PARABRISE': 'PARABRISE',
    'PARABR': 'PARABRISE',
  }
  
  // Chercher un mapping exact ou partiel
  for (const [key, value] of Object.entries(mappings)) {
    if (n === key || n.includes(key) || key.includes(n)) {
      return value
    }
  }
  
  // Vérifications supplémentaires avec includes
  if (n.includes('MAGASIN') && (n.includes('01') || n.includes('1'))) return 'MAG01'
  if (n.includes('MAGASIN') && (n.includes('02') || n.includes('2'))) return 'MAG02'
  if (n.includes('MAGASIN') && (n.includes('03') || n.includes('3'))) return 'MAG03'
  if (n.includes('STOCK') && (n.includes('01') || n.includes('1'))) return 'STOCK01'
  if (n.includes('STOCK') && (n.includes('03') || n.includes('3'))) return 'STOCK03'
  if (n.includes('DANANE') || n.includes('DANANÉ')) return 'DANANE'
  if (n.includes('GUIGLO')) return 'GUIGLO'
  if (n.includes('PARE') && n.includes('BRISE')) return 'PARE-BRISE'
  if (n.includes('PARABR')) return 'PARABRISE'
  
  // Par défaut, retourner null pour signaler un point de vente non reconnu
  return null
}

async function importer() {
  console.log('📦 Import de la nouvelle base de données')
  console.log('=' .repeat(80))
  console.log('')
  if (PRESERVE_STOCKS) {
    console.log('ℹ️  Mode préservation des stocks activé : les stocks existants seront conservés')
    console.log('   (pour forcer l\'écrasement, définir PRESERVE_STOCKS=false)')
    console.log('')
  } else {
    console.log('⚠️  Mode force activé : les stocks existants seront écrasés par les valeurs Excel')
    console.log('')
  }
  
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
    console.log('')
    
    // FILTRER LES LIGNES AVEC DES POINTS D'INTERROGATION
    const lignesAvantFiltre = data.length
    data = data.filter(row => {
      const des = String(row['Désignation'] || '').trim()
      return !des.includes('?') && !/^\?+$/.test(des)
    })
    const lignesSupprimees = lignesAvantFiltre - data.length
    if (lignesSupprimees > 0) {
      console.log(`   ⚠️  ${lignesSupprimees} ligne(s) avec des ? supprimée(s)`)
    }
    
    // FILTRER LES LIGNES AVEC MAGASIN "-"
    const lignesAvantMagasin = data.length
    data = data.filter(row => {
      const mag = String(row['Ref Mag / Stock'] || '').trim()
      return mag !== '-' && mag !== ''
    })
    const lignesMagasinSupprimees = lignesAvantMagasin - data.length
    if (lignesMagasinSupprimees > 0) {
      console.log(`   ⚠️  ${lignesMagasinSupprimees} ligne(s) avec magasin "-" supprimée(s)`)
    }
    
    console.log(`   ✅ ${data.length} lignes valides après filtrage`)
    console.log('')
    
    // Vérifier les colonnes
    const firstRow = data[0]
    const colonnes = Object.keys(firstRow)
    console.log('📋 Colonnes détectées :', colonnes.join(', '))
    console.log('   Note: "Ref Mag / Stock" sera traité comme "Point de ventes"')
    console.log('   Note: "Stock final" sera utilisé comme "Stock Initiale"')
    console.log('')
    
    // Récupérer ou créer les magasins
    console.log('🏪 Traitement des magasins...')
    const magasinsExistants = await prisma.magasin.findMany({
      where: { actif: true },
      select: { id: true, code: true, nom: true },
    })
    
    // Extraire les points de vente uniques selon la liste officielle (9 magasins après fusion)
    const pointsDeVenteOfficiels = ['MAG01', 'MAG02', 'MAG03', 'STOCK01', 'STOCK03', 'DANANE', 'GUIGLO', 'PARE-BRISE', 'PARABRISE']
    const pointsDeVente = new Set()
    data.forEach(row => {
      // Lire "Ref Mag / Stock" (colonne dans Excel) comme "Point de ventes"
      let pv = row['Ref Mag / Stock'] || row['Ref Mag'] || row['Ref Mag/Stock'] || 
               row['Points de vente'] || row['points de vente'] || row['Points_de_vente'] ||
               row['Point de ventes'] || row['Point de vente']
      
      if (pv && String(pv).trim() !== '-' && String(pv).trim() !== '') {
        // FUSIONNER Danane et Danané en DANANE
        const pvUpper = String(pv).trim().toUpperCase()
        if (pvUpper.includes('DANANE') || pvUpper.includes('DANANÉ')) {
          pv = 'DANANE'
        }
        
        const normalise = normaliserMagasin(pv)
        if (normalise && pointsDeVenteOfficiels.includes(normalise)) {
          pointsDeVente.add(normalise)
        }
      }
    })
    
    console.log(`   ✓ ${pointsDeVente.size} point(s) de vente unique(s) trouvé(s)`)
    
    // Créer les magasins manquants
    const magasinMap = new Map()
    for (const m of magasinsExistants) {
      magasinMap.set(m.code.toUpperCase(), m.id)
    }
    
    // Récupérer l'entité par défaut
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
    
    // Créer tous les magasins de la liste officielle
    const nomsMagasins = {
      'MAG01': 'Magasin 01',
      'MAG02': 'Magasin 02',
      'MAG03': 'Magasin 03',
      'STOCK01': 'Stock 01',
      'STOCK03': 'Stock 03',
      'DANANE': 'Danané', // Fusion de Danane + Danané (670 produits)
      'GUIGLO': 'Guiglo',
      'PARE-BRISE': 'Pare-brise',
      'PARABRISE': 'Parabrise',
    }
    
    let magasinsCrees = 0
    for (const pv of pointsDeVenteOfficiels) {
      if (!magasinMap.has(pv)) {
        const magasin = await prisma.magasin.create({
          data: {
            code: pv,
            nom: nomsMagasins[pv] || pv,
            localisation: nomsMagasins[pv] || pv,
            entiteId: entite.id,
            actif: true,
          },
        })
        magasinMap.set(pv, magasin.id)
        magasinsCrees++
        console.log(`   ✓ Magasin créé : ${pv} (${nomsMagasins[pv] || pv})`)
      } else {
        console.log(`   ✓ Magasin existe déjà : ${pv} (${nomsMagasins[pv] || pv})`)
      }
    }
    
    if (magasinsCrees === 0) {
      console.log('   ✓ Tous les magasins de la liste officielle existent déjà')
    }
    console.log('')
    
    // Analyser et créer les catégories
    console.log('📂 Analyse des catégories...')
    const categoriesMap = new Map() // categorie -> count
    const produitsParCategorie = new Map() // categorie -> [produits]
    const designationsVues = new Map() // designation -> count (pour détecter les doublons)
    
    data.forEach(row => {
      const designation = String(row['Désignation'] || row['designation'] || '').trim()
      if (designation) {
        // Détecter les doublons
        const count = designationsVues.get(designation) || 0
        designationsVues.set(designation, count + 1)
        
        const categorie = extraireCategorie(designation)
        categoriesMap.set(categorie, (categoriesMap.get(categorie) || 0) + 1)
        
        if (!produitsParCategorie.has(categorie)) {
          produitsParCategorie.set(categorie, [])
        }
        // Lire "Ref Mag / Stock" comme "Point de ventes"
        let pointDeVente = row['Ref Mag / Stock'] || row['Ref Mag'] || row['Ref Mag/Stock'] || 
                          row['Points de vente'] || row['points de vente'] || row['Points_de_vente'] ||
                          row['Point de ventes'] || row['Point de vente'] || null
        
        // FUSIONNER Danane et Danané en DANANE
        if (pointDeVente) {
          const pvUpper = String(pointDeVente).trim().toUpperCase()
          if (pvUpper.includes('DANANE') || pvUpper.includes('DANANÉ')) {
            pointDeVente = 'DANANE'
          }
        }
        
        // Exclure les lignes avec magasin "-"
        if (!pointDeVente || String(pointDeVente).trim() === '-' || String(pointDeVente).trim() === '') {
          return // Ignorer cette ligne
        }
        
        // Code produit (optionnel) : si présent, upsert par code et un produit peut avoir plusieurs magasins
        const codeExcel = String(row['Code'] || row['code'] || row['Référence'] || row['reference'] || row['Ref'] || '').trim().toUpperCase()
        produitsParCategorie.get(categorie).push({
          code: codeExcel || null, // null = on génère un code
          designation,
          // "Prix d'achat (FCFA)" dans le fichier Excel
          prixAchat: row['Prix d\'achat (FCFA)'] || row['Prix d\'achat'] ||
                     row['Prix (FCFA)'] || row['Prix'] || null,
          // "Ref Mag / Stock" traité comme "Point de ventes" (déjà fusionné Danane)
          pointDeVente: pointDeVente,
          // "Stock final" utilisé comme "Stock Initiale"
          stockInitial: row['Stock final'] || row['Stock finale'] || row['stock final'] ||
                        row['Stok Initial'] || row['Stock Initial'] || row['stock initial'] ||
                        row['Stock Initiale'] || row['stock initiale'] || 0,
        })
      }
    })
    
    // Compter les doublons
    const doublonsCount = Array.from(designationsVues.entries()).filter(([_, count]) => count > 1).length
    console.log(`   ⚠️  ${doublonsCount} désignation(s) en doublon détectée(s) (seront toutes créées)`)
    
    console.log(`   ✓ ${categoriesMap.size} catégorie(s) détectée(s) :`)
    const categoriesTriees = Array.from(categoriesMap.entries()).sort((a, b) => b[1] - a[1])
    categoriesTriees.slice(0, 10).forEach(([cat, count]) => {
      console.log(`      - ${cat}: ${count} produit(s)`)
    })
    if (categoriesTriees.length > 10) {
      console.log(`      ... et ${categoriesTriees.length - 10} autre(s) catégorie(s)`)
    }
    console.log('')
    
    // Importer les produits
    console.log('📦 Import des produits...')
    let created = 0
    let updated = 0
    let stocksCreated = 0
    let errors = []
    
    // Compteur de codes par catégorie pour génération unique
    const codesGeneres = new Map() // categorie -> dernier numéro
    
    // Traiter par catégorie pour générer les codes de manière cohérente
    for (const [categorie, produits] of produitsParCategorie.entries()) {
      // Initialiser le compteur pour cette catégorie
      if (!codesGeneres.has(categorie)) {
        const prefix = categorie.substring(0, 4).toUpperCase().replace(/\s/g, '') || 'DIVE'
        const produitsExistants = await prisma.produit.findMany({
          where: { categorie, actif: true },
          select: { code: true },
        })
        let maxNum = 0
        for (const p of produitsExistants) {
          const code = p.code.toUpperCase()
          if (code.startsWith(prefix)) {
            const numStr = code.substring(prefix.length)
            const num = parseInt(numStr, 10)
            if (!isNaN(num) && num > maxNum) {
              maxNum = num
            }
          }
        }
        codesGeneres.set(categorie, maxNum)
      }
      
      for (const prod of produits) {
        try {
          const designation = prod.designation.trim()
          if (!designation) continue

          // Gérer le prix
          let prixAchat = null
          let prixVente = null // Prix de vente laissé vide (0) pour le moment
          if (prod.prixAchat) {
            const prixNum = Number(String(prod.prixAchat).replace(/[^\d.-]/g, ''))
            if (!isNaN(prixNum) && prixNum > 0) {
              prixAchat = prixNum
              // prixVente reste null (sera 0 dans la BD)
            }
          }

          let produit
          let codeFinal

          if (prod.code) {
            // RÈGLE : colonne Code présente → upsert par code, un produit peut avoir plusieurs magasins (plusieurs stocks)
            codeFinal = prod.code
            const existing = await prisma.produit.findUnique({ where: { code: codeFinal } })
            if (existing) {
              await prisma.produit.update({
                where: { id: existing.id },
                data: { designation, categorie, prixAchat, prixVente, seuilMin: 5, actif: true },
              })
              produit = existing
              updated++
            } else {
              produit = await prisma.produit.create({
                data: {
                  code: codeFinal,
                  designation,
                  categorie,
                  prixAchat,
                  prixVente,
                  seuilMin: 5,
                  actif: true,
                },
              })
              created++
            }
          } else {
            // Pas de Code Excel → générer un code unique (comportement historique)
            // Tous les produits sont créés, y compris les doublons de désignation
            const prefix = categorie.substring(0, 4).toUpperCase().replace(/\s/g, '') || 'DIVE'
            const dernierNum = codesGeneres.get(categorie)
            const nouveauNum = dernierNum + 1
            codesGeneres.set(categorie, nouveauNum)
            let code = `${prefix}${String(nouveauNum).padStart(4, '0')}`
            let numFinal = nouveauNum
            let tentatives = 0
            while (tentatives < 100) {
              const codeExists = await prisma.produit.findUnique({ where: { code } })
              if (!codeExists) break
              numFinal++
              code = `${prefix}${String(numFinal).padStart(4, '0')}`
              tentatives++
            }
            if (tentatives >= 100) {
              errors.push(`${designation}: impossible de trouver un code disponible`)
              continue
            }
            codesGeneres.set(categorie, numFinal)
            codeFinal = code
            produit = await prisma.produit.create({
              data: {
                code: codeFinal,
                designation,
                categorie,
                prixAchat,
                prixVente,
                seuilMin: 5,
                actif: true,
              },
            })
            created++
          }

          // Créer ou mettre à jour le stock pour ce produit × magasin
          if (prod.pointDeVente) {
            let magasinCode = normaliserMagasin(prod.pointDeVente)
            if (String(prod.pointDeVente).toUpperCase().includes('DANANE')) magasinCode = 'DANANE'
            if (magasinCode && magasinMap.has(magasinCode)) {
              const magasinId = magasinMap.get(magasinCode)
              const stockInitiale = Math.max(0, Math.floor(Number(prod.stockInitial) || 0))
              try {
                const stockExistant = await prisma.stock.findFirst({
                  where: { produitId: produit.id, magasinId },
                })
                if (stockExistant) {
                  // RÈGLE : Si PRESERVE_STOCKS=true (défaut), préserver les stocks existants
                  // pour ne pas perdre les enregistrements de production (ventes, achats, etc.)
                  if (PRESERVE_STOCKS) {
                    // Ne rien faire : le stock existant est préservé
                    // (les quantités réelles de production restent intactes)
                  } else {
                    // Mode force : écraser avec les valeurs Excel
                    await prisma.stock.update({
                      where: { id: stockExistant.id },
                      data: { quantite: stockInitiale, quantiteInitiale: stockInitiale },
                    })
                  }
                } else {
                  // Créer le stock uniquement s'il n'existe pas
                  await prisma.stock.create({
                    data: {
                      produitId: produit.id,
                      magasinId,
                      quantite: stockInitiale,
                      quantiteInitiale: stockInitiale,
                    },
                  })
                  stocksCreated++
                }
              } catch (e) {
                errors.push(`Stock ${codeFinal} / ${magasinCode}: ${e.message}`)
              }
            } else if (magasinCode) {
              errors.push(`Magasin non reconnu: ${prod.pointDeVente} (${magasinCode})`)
            }
          }
        } catch (e) {
          errors.push(`${prod.designation}: ${e.message}`)
        }
      }
    }
    
    console.log('')
    console.log('✅ Import terminé !')
    console.log('')
    console.log('📊 Résultats :')
    console.log(`   ✓ Produits créés : ${created}`)
    console.log(`   ✓ Produits mis à jour : ${updated}`)
    console.log(`   ✓ Stocks créés : ${stocksCreated}`)
    console.log(`   ✓ Magasins créés : ${magasinsCrees}`)
    const doublonsCountFinal = Array.from(designationsVues.entries()).filter(([_, count]) => count > 1).length
    if (doublonsCountFinal > 0) {
      console.log(`   ⚠️  Doublons détectés : ${doublonsCountFinal} désignation(s) (tous créés)`)
    }
    if (errors.length > 0) {
      console.log(`   ⚠️  Erreurs : ${errors.length}`)
      if (errors.length <= 10) {
        errors.forEach(err => console.log(`      - ${err}`))
      } else {
        errors.slice(0, 10).forEach(err => console.log(`      - ${err}`))
        console.log(`      ... et ${errors.length - 10} autre(s) erreur(s)`)
      }
    }
    console.log('')
    
    // Sauvegarder la liste des doublons détectés (pour information, tous sont créés)
    if (doublonsCountFinal > 0) {
      const doublonsPath = path.join(__dirname, '..', 'docs', 'doublons-produits.json')
      const doublonsListe = Array.from(designationsVues.entries())
        .filter(([_, count]) => count > 1)
        .map(([designation, count]) => ({
          designation,
          nombreOccurrences: count,
          note: 'Tous les produits avec cette désignation ont été créés dans la BD',
        }))
      
      fs.writeFileSync(doublonsPath, JSON.stringify(doublonsListe, null, 2), 'utf8')
      console.log(`📄 Liste des doublons sauvegardée (pour information) : ${doublonsPath}`)
      console.log(`   Total : ${doublonsListe.length} désignation(s) en doublon (toutes créées)`)
      console.log('')
    }
    
    console.log('📝 Prochaines étapes :')
    console.log('   1. Vérifiez les produits dans l\'interface')
    console.log('   2. Vérifiez les catégories générées')
    console.log('   3. Les prix de vente sont vides (à remplir manuellement)')
    if (PRESERVE_STOCKS) {
      console.log('   4. Les stocks existants ont été préservés (non modifiés)')
      console.log('   5. Seuls les stocks manquants ont été créés depuis "Stock final"')
    } else {
      console.log('   4. Les stocks ont été importés/écrasés depuis "Stock final"')
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
importer()
  .then(() => {
    console.log('✨ Opération terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('')
    console.error('💥 Erreur fatale :', error)
    process.exit(1)
  })
