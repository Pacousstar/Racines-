/**
 * Script pour analyser les catégories dans le fichier Excel
 * Aide à améliorer l'algorithme de catégorisation
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx-prototype-pollution-fixed')

const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

function analyserCategories() {
  console.log('📊 Analyse des catégories potentielles\n')
  
  if (!fs.existsSync(FILE_PATH)) {
    console.error('❌ Fichier introuvable')
    process.exit(1)
  }

  const workbook = XLSX.readFile(FILE_PATH)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null })
  
  // Analyser les premiers mots de chaque désignation
  const premiersMots = new Map()
  const deuxPremiersMots = new Map()
  
  data.forEach(row => {
    const des = String(row['Désignation'] || '').trim().toUpperCase()
    if (des) {
      const mots = des.split(/\s+/).filter(m => m.length > 0)
      if (mots.length > 0) {
        const premier = mots[0]
        premiersMots.set(premier, (premiersMots.get(premier) || 0) + 1)
        
        if (mots.length > 1) {
          const deux = `${mots[0]} ${mots[1]}`
          deuxPremiersMots.set(deux, (deuxPremiersMots.get(deux) || 0) + 1)
        }
      }
    }
  })
  
  console.log('🔤 Premiers mots les plus fréquents (top 30) :')
  Array.from(premiersMots.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([mot, count]) => {
      console.log(`   ${mot.padEnd(20)} : ${count}`)
    })
  
  console.log('\n🔤 Deux premiers mots les plus fréquents (top 20) :')
  Array.from(deuxPremiersMots.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([mot, count]) => {
      console.log(`   ${mot.padEnd(30)} : ${count}`)
    })
  
  console.log('\n📝 Exemples de désignations (20 premières) :')
  data.slice(0, 20).forEach((row, idx) => {
    const des = String(row['Désignation'] || '').trim()
    console.log(`   ${idx + 1}. ${des}`)
  })
}

analyserCategories()
