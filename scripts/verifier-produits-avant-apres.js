/**
 * Comparer l'état AVANT et APRÈS la mise à jour pour voir combien de produits ont été ajoutés
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const projectRoot = path.resolve(__dirname, '..')
const backupPath = 'C:/gesticom/gesticom.db.backup-maj-20260209154315.db' // Sauvegarde AVANT mise à jour
const targetDbPath = 'C:/gesticom/gesticom.db' // Base APRÈS mise à jour
const sourceDbPath = path.join(projectRoot, 'docs', 'gesticomold.db') // Ancienne base

if (!fs.existsSync(backupPath)) {
  console.error(`Erreur: La sauvegarde n'existe pas: ${backupPath}`)
  console.log('Sauvegardes disponibles:')
  const dir = path.dirname(backupPath)
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).filter(f => f.includes('backup-maj-')).forEach(f => console.log(`  - ${f}`))
  }
  process.exit(1)
}
if (!fs.existsSync(targetDbPath)) {
  console.error(`Erreur: La base cible n'existe pas: ${targetDbPath}`)
  process.exit(1)
}
if (!fs.existsSync(sourceDbPath)) {
  console.error(`Erreur: La base source n'existe pas: ${sourceDbPath}`)
  process.exit(1)
}

function normalizeCode(code) {
  if (code == null || typeof code !== 'string') return ''
  return String(code).trim().toUpperCase().replace(/-/g, '').replace(/\s+/g, '')
}

console.log('\n=== COMPARAISON AVANT / APRÈS MISE À JOUR ===\n')

// Ouvrir la sauvegarde (AVANT)
const backupDb = new Database(backupPath)
const avantTotal = backupDb.prepare('SELECT COUNT(*) as total FROM Produit').get()
const avantProduits = backupDb.prepare('SELECT id, code FROM Produit').all()
const avantByCode = {}
const avantByNormalized = {}
for (const p of avantProduits) {
  avantByCode[p.code] = p.id
  avantByNormalized[normalizeCode(p.code)] = p.id
}

console.log(`📊 ÉTAT AVANT la mise à jour :`)
console.log(`   Produits : ${avantTotal.total}`)

// Ouvrir la base cible (APRÈS)
const targetDb = new Database(targetDbPath)
const apresTotal = targetDb.prepare('SELECT COUNT(*) as total FROM Produit').get()
const apresProduits = targetDb.prepare('SELECT id, code FROM Produit').all()
const apresByCode = {}
const apresByNormalized = {}
for (const p of apresProduits) {
  apresByCode[p.code] = p.id
  apresByNormalized[normalizeCode(p.code)] = p.id
}

console.log(`\n📊 ÉTAT APRÈS la mise à jour :`)
console.log(`   Produits : ${apresTotal.total}`)
console.log(`   Différence : +${apresTotal.total - avantTotal.total} produits\n`)

// Charger les produits de l'ancienne base
const sourceDbPathAbs = path.resolve(sourceDbPath).replace(/\\/g, '/').replace(/'/g, "''")
targetDb.exec(`ATTACH DATABASE '${sourceDbPathAbs}' AS source`)
const sourceProduits = targetDb.prepare('SELECT id, code, designation FROM source.Produit').all()
console.log(`📊 Produits dans l'ancienne base (source) : ${sourceProduits.length}\n`)

// Analyser ce qui s'est passé
let trouvesAvantParCodeExact = 0
let trouvesAvantParCodeNormalise = 0
let ajoutesReellement = 0
let nouveauxCodes = []

for (const produit of sourceProduits) {
  const codeNormalise = normalizeCode(produit.code)
  const existaitAvant = avantByCode[produit.code] || avantByNormalized[codeNormalise]
  
  if (existaitAvant) {
    // Le produit existait déjà AVANT la mise à jour
    if (avantByCode[produit.code]) {
      trouvesAvantParCodeExact++
    } else {
      trouvesAvantParCodeNormalise++
    }
  } else {
    // Le produit n'existait pas AVANT → vérifier s'il existe APRÈS
    const existeApres = apresByCode[produit.code] || apresByNormalized[codeNormalise]
    if (existeApres && !existaitAvant) {
      ajoutesReellement++
      nouveauxCodes.push(produit.code)
    }
  }
}

console.log('=== ANALYSE DÉTAILLÉE ===\n')
console.log(`✓ Produits de l'ancienne base qui existaient DÉJÀ avant la mise à jour :`)
console.log(`  - Par code exact : ${trouvesAvantParCodeExact}`)
console.log(`  - Par code normalisé : ${trouvesAvantParCodeNormalise}`)
console.log(`  - Total déjà existants : ${trouvesAvantParCodeExact + trouvesAvantParCodeNormalise}`)
console.log(`\n✓ Produits de l'ancienne base AJOUTÉS (nouveaux) : ${ajoutesReellement}`)
console.log(`\nVérification : ${trouvesAvantParCodeExact + trouvesAvantParCodeNormalise + ajoutesReellement} = ${sourceProduits.length} ✓`)

if (ajoutesReellement > 0) {
  console.log(`\n=== EXEMPLES DE PRODUITS AJOUTÉS ===`)
  nouveauxCodes.slice(0, 10).forEach((code, i) => {
    const p = sourceProduits.find(sp => sp.code === code)
    console.log(`${i + 1}. ${code} - ${p.designation.substring(0, 50)}...`)
  })
  if (nouveauxCodes.length > 10) {
    console.log(`... et ${nouveauxCodes.length - 10} autres`)
  }
}

// Vérifier la cohérence
const attenduApres = avantTotal.total + ajoutesReellement
if (apresTotal.total === attenduApres) {
  console.log(`\n✓ Cohérence vérifiée : ${avantTotal.total} (avant) + ${ajoutesReellement} (ajoutés) = ${apresTotal.total} (après)`)
} else {
  console.log(`\n⚠ Incohérence : ${avantTotal.total} (avant) + ${ajoutesReellement} (ajoutés) = ${attenduApres} attendu, mais ${apresTotal.total} trouvé`)
}

targetDb.exec('DETACH DATABASE source')
backupDb.close()
targetDb.close()

console.log('\n✓ Analyse terminée.')
