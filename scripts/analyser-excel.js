/**
 * Script pour analyser le fichier Excel GestiCom BD FINALE.xlsx
 * Affiche un topo complet : nombre de produits, colonnes, structure, etc.
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx-prototype-pollution-fixed')

const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

function analyserExcel() {
  console.log('📊 Analyse du fichier Excel : GestiCom BD FINALE.xlsx\n')
  console.log('=' .repeat(80))
  
  if (!fs.existsSync(FILE_PATH)) {
    console.error('❌ Fichier introuvable :', FILE_PATH)
    process.exit(1)
  }

  try {
    const workbook = XLSX.readFile(FILE_PATH)
    const sheetNames = workbook.SheetNames
    
    console.log(`📑 Nombre d'onglets : ${sheetNames.length}`)
    console.log(`📋 Onglets : ${sheetNames.join(', ')}\n`)
    
    // Analyser chaque onglet
    for (const sheetName of sheetNames) {
      console.log('─'.repeat(80))
      console.log(`\n📄 ONGLET : "${sheetName}"`)
      console.log('─'.repeat(80))
      
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: null 
      })
      
      if (data.length === 0) {
        console.log('⚠️  Onglet vide')
        continue
      }
      
      console.log(`\n📊 Nombre de lignes (produits) : ${data.length}`)
      
      // Analyser les colonnes
      const firstRow = data[0]
      const colonnes = Object.keys(firstRow)
      
      console.log(`\n📋 Colonnes trouvées (${colonnes.length}) :`)
      colonnes.forEach((col, idx) => {
        console.log(`   ${idx + 1}. ${col}`)
      })
      
      // Vérifier les colonnes importantes
      console.log(`\n🔍 Vérification des colonnes importantes :`)
      const colonnesLower = colonnes.map(c => c.toLowerCase().trim())
      
      const checks = {
        'Code': colonnesLower.some(c => c.includes('code')),
        'Designation': colonnesLower.some(c => c.includes('designation') || c.includes('désignation')),
        'Categorie': colonnesLower.some(c => c.includes('categorie') || c.includes('catégorie')),
        'PrixAchat': colonnesLower.some(c => c.includes('prix') && (c.includes('achat') || c.includes('achat'))),
        'PrixVente': colonnesLower.some(c => c.includes('prix') && (c.includes('vente') || c.includes('vente'))),
        'Stock Initiale': colonnesLower.some(c => c.includes('stock') && (c.includes('initiale') || c.includes('initial'))),
        'Quantite': colonnesLower.some(c => c.includes('quantite') || c.includes('quantité') || c.includes('qte')),
        'Magasin': colonnesLower.some(c => c.includes('magasin') || c.includes('point') || c.includes('pv')),
      }
      
      Object.entries(checks).forEach(([nom, present]) => {
        console.log(`   ${present ? '✅' : '❌'} ${nom}`)
      })
      
      // Analyser quelques exemples de données
      console.log(`\n📝 Exemples de données (3 premières lignes) :`)
      data.slice(0, 3).forEach((row, idx) => {
        console.log(`\n   Ligne ${idx + 1} :`)
        colonnes.forEach(col => {
          const val = row[col]
          const display = val != null ? String(val).substring(0, 50) : '(vide)'
          console.log(`      ${col}: ${display}`)
        })
      })
      
      // Statistiques
      console.log(`\n📈 Statistiques :`)
      
      // Compter les valeurs non vides par colonne
      const stats = {}
      colonnes.forEach(col => {
        const nonVides = data.filter(row => row[col] != null && String(row[col]).trim() !== '').length
        stats[col] = {
          nonVides,
          vides: data.length - nonVides,
          pourcentage: ((nonVides / data.length) * 100).toFixed(1)
        }
      })
      
      console.log(`   Colonnes avec données :`)
      Object.entries(stats).forEach(([col, stat]) => {
        if (stat.nonVides > 0) {
          console.log(`      ${col}: ${stat.nonVides}/${data.length} (${stat.pourcentage}%)`)
        }
      })
      
      // Vérifier les doublons de codes
      const codeCol = colonnes.find(c => colonnesLower[colonnes.indexOf(c)].includes('code'))
      if (codeCol) {
        const codes = data.map(row => String(row[codeCol] || '').trim().toUpperCase()).filter(c => c)
        const codesUniques = new Set(codes)
        const doublons = codes.length - codesUniques.size
        
        console.log(`\n   🔑 Codes produits :`)
        console.log(`      Total : ${codes.length}`)
        console.log(`      Uniques : ${codesUniques.size}`)
        if (doublons > 0) {
          console.log(`      ⚠️  Doublons : ${doublons}`)
        }
      }
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('\n✅ Analyse terminée\n')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse :', error)
    process.exit(1)
  }
}

analyserExcel()
