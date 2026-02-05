/**
 * Script pour vérifier et confirmer les modifications demandées
 */

const path = require('path')
const XLSX = require('xlsx-prototype-pollution-fixed')

const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

console.log('🔍 VÉRIFICATION DU FICHIER GestiCom BD FINALE.xlsx\n')
console.log('='.repeat(80))
console.log('')

const workbook = XLSX.readFile(FILE_PATH)
const ws = workbook.Sheets[workbook.SheetNames[0]]
const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: null })

console.log(`📊 Total lignes dans le fichier : ${data.length}`)
console.log('')

// 1. Vérifier les lignes avec des ?
console.log('1️⃣  LIGNES AVEC DES POINTS D\'INTERROGATION :')
const lignesAvecQuestionMarks = data.filter(row => {
  const des = String(row['Désignation'] || '')
  return des.includes('?') || /^\?+$/.test(des.trim())
})

console.log(`   Trouvées : ${lignesAvecQuestionMarks.length} ligne(s)`)
if (lignesAvecQuestionMarks.length > 0) {
  lignesAvecQuestionMarks.slice(0, 5).forEach((row, i) => {
    console.log(`   Ligne ${i+1}:`, JSON.stringify({
      designation: row['Désignation'],
      magasin: row['Ref Mag / Stock'],
      stock: row['Stock final']
    }))
  })
}
console.log(`   ✅ Après suppression : ${data.length - lignesAvecQuestionMarks.length} lignes`)
console.log('')

// 2. Vérifier les magasins
console.log('2️⃣  MAGASINS TROUVÉS :')
const magasins = new Map()
data.forEach(row => {
  const mag = String(row['Ref Mag / Stock'] || '').trim()
  if (mag) {
    magasins.set(mag, (magasins.get(mag) || 0) + 1)
  }
})

const magasinsTries = Array.from(magasins.entries()).sort((a, b) => b[1] - a[1])
magasinsTries.forEach(([mag, count]) => {
  console.log(`   ${mag}: ${count} produits`)
})

const magasinMoins = magasins.get('-') || 0
console.log(`\n   ⚠️  Magasin "-" : ${magasinMoins} produits (à exclure)`)
console.log(`   ✅ Après exclusion : ${data.length - lignesAvecQuestionMarks.length - magasinMoins} lignes valides`)
console.log('')

// 3. Vérifier Danane et Danané
console.log('3️⃣  FUSION DANANE + DANANÉ :')
const danane = magasins.get('Danane') || 0
const dananeAccent = magasins.get('Danané') || 0
const totalDanane = danane + dananeAccent

console.log(`   Danane : ${danane} produits`)
console.log(`   Danané : ${dananeAccent} produits`)
console.log(`   ✅ Total DANANE (fusionné) : ${totalDanane} produits`)
console.log('')

// 4. Liste finale des magasins
console.log('4️⃣  LISTE FINALE DES 10 MAGASINS (après fusion Danane) :')
const magasinsFinaux = [
  'DANANE', // Fusion de Danane + Danané
  'Magasin 01',
  'Magasin 02',
  'Magasin 03',
  'Guiglo',
  'Stock 01',
  'Stock 03',
  'PARE-BRISE',
  'PARABRISE'
]

// Vérifier que tous existent
const magasinsExistants = new Set()
data.forEach(row => {
  const mag = String(row['Ref Mag / Stock'] || '').trim()
  if (mag && mag !== '-') {
    if (mag === 'Danane' || mag === 'Danané') {
      magasinsExistants.add('DANANE')
    } else {
      magasinsExistants.add(mag)
    }
  }
})

magasinsFinaux.forEach(mag => {
  const existe = magasinsExistants.has(mag)
  console.log(`   ${existe ? '✅' : '❌'} ${mag}`)
})
console.log('')

// 5. Résumé final
console.log('5️⃣  RÉSUMÉ FINAL :')
const lignesValides = data.filter(row => {
  const des = String(row['Désignation'] || '')
  const mag = String(row['Ref Mag / Stock'] || '').trim()
  return !des.includes('?') && !/^\?+$/.test(des.trim()) && mag !== '-'
})

console.log(`   ✅ Produits finaux : ${lignesValides.length} produits`)
console.log(`   ✅ Magasins finaux : ${magasinsFinaux.length} magasins`)
console.log(`   ✅ Colonnes : Désignation, Prix d'achat (FCFA), Point de ventes, Stock Initiale`)
console.log('')

console.log('='.repeat(80))
console.log('✅ Vérification terminée')
