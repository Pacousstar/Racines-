/**
 * Script pour analyser le fichier GestiCom BD FINALE.xlsx
 * et comprendre sa structure
 */

const path = require('path')
const XLSX = require('xlsx-prototype-pollution-fixed')

const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom BD FINALE.xlsx')

console.log('📊 Analyse du fichier : GestiCom BD FINALE.xlsx\n')
console.log('='.repeat(80))
console.log('')

if (!require('fs').existsSync(FILE_PATH)) {
  console.error('❌ Fichier introuvable :', FILE_PATH)
  process.exit(1)
}

try {
  const workbook = XLSX.readFile(FILE_PATH)
  
  console.log('📑 ONGLETS TROUVÉS :')
  workbook.SheetNames.forEach((name, i) => {
    console.log(`   ${i + 1}. ${name}`)
  })
  console.log('')
  
  // Analyser chaque onglet
  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`📋 ONGLET : ${sheetName}`)
    console.log('='.repeat(80))
    
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null })
    
    if (data.length === 0) {
      console.log('   ⚠️  Onglet vide')
      return
    }
    
    console.log(`   📊 Nombre de lignes : ${data.length}`)
    console.log('')
    
    // Colonnes
    const firstRow = data[0]
    const colonnes = Object.keys(firstRow)
    console.log('   📝 COLONNES DÉTECTÉES :')
    colonnes.forEach((col, i) => {
      console.log(`      ${i + 1}. ${col}`)
    })
    console.log('')
    
    // Afficher les 5 premières lignes
    console.log('   📄 PREMIÈRES LIGNES (exemple) :')
    const lignesAfficher = Math.min(5, data.length)
    for (let i = 0; i < lignesAfficher; i++) {
      console.log(`\n      Ligne ${i + 1}:`)
      const row = data[i]
      colonnes.forEach(col => {
        const value = row[col]
        if (value != null && value !== '') {
          console.log(`         ${col}: ${value}`)
        }
      })
    }
    
    // Rechercher des colonnes spécifiques
    console.log('\n   🔍 RECHERCHE DE COLONNES IMPORTANTES :')
    const colonnesLower = colonnes.map(c => c.toLowerCase())
    
    const rechercheColonnes = {
      'Désignation': ['désignation', 'designation', 'libellé', 'libelle', 'nom', 'produit'],
      'Code': ['code', 'référence', 'reference', 'ref', 'id'],
      'Prix': ['prix', 'prix d\'achat', 'prix achat', 'prix_achat', 'prix d\'vente', 'prix vente', 'prix_vente'],
      'Stock Initial': ['stock initial', 'stock_initial', 'stok initial', 'quantité initiale', 'quantite initiale', 'qte initiale'],
      'Stock Final': ['stock final', 'stock_final', 'stock finale', 'quantité finale', 'quantite finale'],
      'Magasin': ['magasin', 'point de vente', 'points de vente', 'ref mag', 'mag', 'lieu', 'succursale'],
      'Catégorie': ['catégorie', 'categorie', 'type', 'famille']
    }
    
    Object.entries(rechercheColonnes).forEach(([nomRecherche, termes]) => {
      const trouve = colonnes.find(col => {
        const colLower = col.toLowerCase()
        return termes.some(terme => colLower.includes(terme))
      })
      if (trouve) {
        console.log(`      ✓ ${nomRecherche} : "${trouve}"`)
      } else {
        console.log(`      ✗ ${nomRecherche} : NON TROUVÉ`)
      }
    })
    
    // Statistiques
    console.log('\n   📈 STATISTIQUES :')
    const designations = new Set()
    const magasins = new Set()
    data.forEach(row => {
      const des = row['Désignation'] || row['designation']
      if (des) designations.add(String(des).trim())
      
      const mag = row['Ref Mag / Stock'] || row['Ref Mag'] || row['Magasin'] || row['magasin']
      if (mag) magasins.add(String(mag).trim())
    })
    
    console.log(`      Produits uniques : ${designations.size}`)
    console.log(`      Magasins uniques : ${magasins.size}`)
    if (magasins.size > 0) {
      console.log(`      Magasins trouvés : ${Array.from(magasins).join(', ')}`)
    }
  })
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ Analyse terminée')
  
} catch (error) {
  console.error('❌ Erreur lors de l\'analyse :', error.message)
  process.exit(1)
}
