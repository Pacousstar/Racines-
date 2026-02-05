/**
 * Vérifie directement avec SQL brut (sans Prisma)
 */

const Database = require('better-sqlite3')
const path = require('path')

const baseSource = path.resolve(__dirname, '..', 'prisma', 'gesticom.db')
const basePortable = path.resolve(__dirname, '..', 'GestiCom-Portable', 'data', 'gesticom.db')

function verifierBase(dbPath, nom) {
  const db = new Database(dbPath, { readonly: true })
  
  try {
    const count = db.prepare('SELECT COUNT(*) as n FROM Produit').get()
    const withPrice = db.prepare('SELECT COUNT(*) as n FROM Produit WHERE prixAchat > 0').get()
    const withStock = db.prepare('SELECT COUNT(*) as n FROM Stock WHERE quantite > 0').get()
    
    const sample = db.prepare('SELECT code, designation, prixAchat, prixVente FROM Produit WHERE prixAchat > 0 LIMIT 1').get()
    
    return {
      nom,
      produits: count.n,
      avecPrix: withPrice.n,
      avecStock: withStock.n,
      exemple: sample
    }
  } finally {
    db.close()
  }
}

console.log('=== Vérification SQL directe ===\n')

const source = verifierBase(baseSource, 'SOURCE')
const portable = verifierBase(basePortable, 'PORTABLE')

console.log('BASE SOURCE:')
console.log(`  Produits: ${source.produits}`)
console.log(`  Avec prix: ${source.avecPrix}`)
console.log(`  Avec stock: ${source.avecStock}`)
console.log(`  Exemple: ${JSON.stringify(source.exemple)}`)

console.log('\nBASE PORTABLE:')
console.log(`  Produits: ${portable.produits}`)
console.log(`  Avec prix: ${portable.avecPrix}`)
console.log(`  Avec stock: ${portable.avecStock}`)
console.log(`  Exemple: ${JSON.stringify(portable.exemple)}`)

if (source.produits === portable.produits && 
    source.avecPrix === portable.avecPrix && 
    source.avecStock === portable.avecStock) {
  console.log('\n✓ Les bases sont identiques')
} else {
  console.log('\n✗ Les bases sont différentes')
}
