/**
 * Script de vérification : combien de produits de l'ancienne base ont été ajoutés vs existaient déjà
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '..')
const sourceDbPath = path.join(projectRoot, 'docs', 'gesticomold.db')
const targetDbPath = 'C:/gesticom/gesticom.db'

if (!fs.existsSync(sourceDbPath)) {
  console.error(`Erreur: La base source n'existe pas: ${sourceDbPath}`)
  process.exit(1)
}
if (!fs.existsSync(targetDbPath)) {
  console.error(`Erreur: La base cible n'existe pas: ${targetDbPath}`)
  process.exit(1)
}

function normalizeCode(code) {
  if (code == null || typeof code !== 'string') return ''
  return String(code).trim().toUpperCase().replace(/-/g, '').replace(/\s+/g, '')
}

const targetDb = new Database(targetDbPath)
const sourceDbPathAbs = path.resolve(sourceDbPath).replace(/\\/g, '/').replace(/'/g, "''")
targetDb.exec(`ATTACH DATABASE '${sourceDbPathAbs}' AS source`)

console.log('\n=== VÉRIFICATION DES PRODUITS ===\n')

// Charger tous les produits de la cible
const targetProduits = targetDb.prepare('SELECT id, code FROM main.Produit').all()
const byCode = {}
const byNormalized = {}
for (const p of targetProduits) {
  byCode[p.code] = p.id
  byNormalized[normalizeCode(p.code)] = p.id
}

console.log(`Produits dans la nouvelle base (cible) : ${targetProduits.length}`)

// Charger tous les produits de l'ancienne base
const sourceProduits = targetDb.prepare('SELECT id, code, designation FROM source.Produit').all()
console.log(`Produits dans l'ancienne base (source) : ${sourceProduits.length}\n`)

let trouvesParCodeExact = 0
let trouvesParCodeNormalise = 0
let ajoutes = 0
const produitsAjoutes = []
const produitsTrouves = []

for (const produit of sourceProduits) {
  const codeNormalise = normalizeCode(produit.code)
  let trouve = false
  let methode = null
  
  // Chercher par code exact
  if (byCode[produit.code]) {
    trouve = true
    methode = 'code exact'
    trouvesParCodeExact++
  }
  // Chercher par code normalisé
  else if (byNormalized[codeNormalise]) {
    trouve = true
    methode = 'code normalisé'
    trouvesParCodeNormalise++
  }
  
  if (trouve) {
    produitsTrouves.push({
      code: produit.code,
      designation: produit.designation,
      methode
    })
  } else {
    ajoutes++
    produitsAjoutes.push({
      code: produit.code,
      designation: produit.designation
    })
  }
}

console.log('=== RÉSULTATS ===\n')
console.log(`✓ Trouvés par code exact : ${trouvesParCodeExact}`)
console.log(`✓ Trouvés par code normalisé : ${trouvesParCodeNormalise}`)
console.log(`✓ Total trouvés (déjà existants) : ${trouvesParCodeExact + trouvesParCodeNormalise}`)
console.log(`\n✓ Ajoutés (nouveaux) : ${ajoutes}`)
console.log(`\nTotal source : ${sourceProduits.length}`)
console.log(`Vérification : ${(trouvesParCodeExact + trouvesParCodeNormalise + ajoutes)} = ${sourceProduits.length} ✓\n`)

// Vérifier le nombre total de produits dans la cible maintenant
const totalApres = targetDb.prepare('SELECT COUNT(*) as total FROM main.Produit').get()
console.log(`\nProduits dans la base cible après mise à jour : ${totalApres.total}`)
console.log(`Attendu : ${targetProduits.length} (initial) + ${ajoutes} (ajoutés) = ${targetProduits.length + ajoutes}`)

if (totalApres.total === targetProduits.length + ajoutes) {
  console.log('✓ Les nombres correspondent !\n')
} else {
  console.log(`⚠ Différence : ${totalApres.total - (targetProduits.length + ajoutes)} produits\n`)
}

// Afficher quelques exemples
if (produitsTrouves.length > 0) {
  console.log('\n=== EXEMPLES DE PRODUITS TROUVÉS (déjà existants) ===')
  produitsTrouves.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.code} - ${p.designation.substring(0, 50)}... (${p.methode})`)
  })
  if (produitsTrouves.length > 5) {
    console.log(`... et ${produitsTrouves.length - 5} autres`)
  }
}

if (produitsAjoutes.length > 0) {
  console.log('\n=== EXEMPLES DE PRODUITS AJOUTÉS (nouveaux) ===')
  produitsAjoutes.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.code} - ${p.designation.substring(0, 50)}...`)
  })
  if (produitsAjoutes.length > 5) {
    console.log(`... et ${produitsAjoutes.length - 5} autres`)
  }
}

targetDb.exec('DETACH DATABASE source')
targetDb.close()

console.log('\n✓ Vérification terminée.')
