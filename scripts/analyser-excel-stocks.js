/**
 * Analyse le fichier Excel pour vérifier les valeurs de "Stock final"
 */

const path = require('path')
const XLSX = require('xlsx-prototype-pollution-fixed')

const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

if (!require('fs').existsSync(FILE_PATH)) {
  console.error(`❌ Fichier introuvable : ${FILE_PATH}`)
  process.exit(1)
}

const workbook = XLSX.readFile(FILE_PATH)
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]
const data = XLSX.utils.sheet_to_json(worksheet, { defval: null })

console.log('📊 ANALYSE DU FICHIER EXCEL - COLONNE "Stock final"')
console.log('='.repeat(80))
console.log('')

// Trouver la colonne "Stock final"
const premierLigne = data[0]
const colonnes = Object.keys(premierLigne)
const colonneStock = colonnes.find(c => 
  c && (
    c.toLowerCase().includes('stock final') ||
    c.toLowerCase().includes('stock finale') ||
    c.toLowerCase().includes('stock initial') ||
    c.toLowerCase().includes('stock initiale')
  )
)

if (!colonneStock) {
  console.log('⚠️  Colonne "Stock final" non trouvée')
  console.log('📋 Colonnes disponibles :')
  colonnes.forEach(c => console.log(`   - ${c}`))
  process.exit(1)
}

console.log(`✅ Colonne trouvée : "${colonneStock}"`)
console.log('')

// Analyser les valeurs
let totalLignes = 0
let lignesAvecStock = 0
let lignesSansStock = 0
let stockTotal = 0
let stockMax = 0
let stockMin = Infinity
const exemples = []

data.forEach((row, index) => {
  totalLignes++
  const stockValue = row[colonneStock]
  const stockNum = stockValue != null ? Number(stockValue) : 0
  
  if (stockNum > 0) {
    lignesAvecStock++
    stockTotal += stockNum
    stockMax = Math.max(stockMax, stockNum)
    stockMin = Math.min(stockMin, stockNum)
    
    if (exemples.length < 10) {
      exemples.push({
        ligne: index + 2, // +2 car index 0 = ligne 2 dans Excel
        designation: row['Désignation'] || row['designation'] || 'N/A',
        stock: stockNum
      })
    }
  } else {
    lignesSansStock++
  }
})

console.log('📊 STATISTIQUES :')
console.log(`   Total lignes : ${totalLignes}`)
console.log(`   Lignes avec stock > 0 : ${lignesAvecStock}`)
console.log(`   Lignes sans stock (0 ou null) : ${lignesSansStock}`)
console.log(`   Stock total : ${stockTotal}`)
console.log(`   Stock max : ${stockMax}`)
console.log(`   Stock min : ${stockMin > 0 ? stockMin : 'N/A (tous à 0)'}`)
console.log(`   Stock moyen : ${lignesAvecStock > 0 ? (stockTotal / lignesAvecStock).toFixed(2) : 0}`)
console.log('')

if (exemples.length > 0) {
  console.log('📋 EXEMPLES DE LIGNES AVEC STOCK > 0 (10 premiers) :')
  exemples.forEach((ex, i) => {
    console.log(`   ${i + 1}. Ligne ${ex.ligne} - ${ex.designation} : ${ex.stock}`)
  })
  console.log('')
}

if (lignesAvecStock === 0) {
  console.log('⚠️  ATTENTION : Aucune ligne avec stock > 0 dans le fichier Excel !')
  console.log('   Vérifiez que la colonne "Stock final" contient bien des valeurs.')
} else {
  console.log(`✅ ${lignesAvecStock} lignes avec stock > 0 trouvées`)
  console.log('   Ces valeurs devraient être importées comme "quantité initiale"')
}
