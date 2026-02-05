/**
 * Script de mise à jour des paiements (avance / reste à payer).
 * - Ajoute les colonnes montantPaye et statutPaiement si elles n'existent pas (SQLite).
 * - Met à jour les enregistrements existants : montantPaye = total et statutPaiement = 'PAYE'
 *   pour les ventes/achats/dépenses qui ont encore montantPaye = 0 et statutPaiement = 'PAYE'
 *   (données créées avant l'introduction de la fonctionnalité).
 *
 * Exécution : depuis la racine du projet gesticom
 *   node scripts/backfill-montant-paye.js
 *
 * Nécessite : DATABASE_URL dans .env et Prisma généré (npx prisma generate).
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const ALLOWED_TABLES = ['Vente', 'Achat', 'Depense']

function checkTable(tableName) {
  if (!ALLOWED_TABLES.includes(tableName)) throw new Error('Table non autorisée')
}

async function columnExists(tableName, columnName) {
  checkTable(tableName)
  const r = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as n FROM pragma_table_info('${tableName}') WHERE name = '${columnName}'`
  )
  return Number(r?.[0]?.n ?? 0) > 0
}

async function addColumnIfMissing(tableName, columnDef) {
  checkTable(tableName)
  const [colName] = columnDef.split(' ').filter(Boolean)
  const exists = await columnExists(tableName, colName)
  if (exists) return false
  await prisma.$executeRawUnsafe(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`)
  return true
}

async function main() {
  console.log('Vérification des colonnes montantPaye / statutPaiement...')

  const tables = [
    { table: 'Vente', totalCol: 'montantTotal' },
    { table: 'Achat', totalCol: 'montantTotal' },
    { table: 'Depense', totalCol: 'montant' },
  ]

  for (const { table, totalCol } of tables) {
    try {
      const hasPaye = await columnExists(table, 'montantPaye')
      const hasStatut = await columnExists(table, 'statutPaiement')
      if (!hasPaye) {
        await addColumnIfMissing(table, 'montantPaye REAL DEFAULT 0')
        console.log(`  ${table}: colonne montantPaye ajoutée`)
      }
      if (!hasStatut) {
        await addColumnIfMissing(table, 'statutPaiement TEXT DEFAULT \'PAYE\'')
        console.log(`  ${table}: colonne statutPaiement ajoutée`)
      }
    } catch (e) {
      if (e.message && e.message.includes('no such table')) {
        console.log(`  ${table}: table absente, ignorée`)
      } else {
        throw e
      }
    }
  }

  console.log('Mise à jour des enregistrements existants (avance = total, statut = PAYE)...')

  const uVente = await prisma.$executeRawUnsafe(
    `UPDATE Vente SET montantPaye = montantTotal, statutPaiement = 'PAYE' WHERE montantPaye = 0 AND statutPaiement = 'PAYE'`
  )
  console.log(`  Vente: ${uVente} enregistrement(s) mis à jour`)

  const uAchat = await prisma.$executeRawUnsafe(
    `UPDATE Achat SET montantPaye = montantTotal, statutPaiement = 'PAYE' WHERE montantPaye = 0 AND statutPaiement = 'PAYE'`
  )
  console.log(`  Achat: ${uAchat} enregistrement(s) mis à jour`)

  try {
    const uDepense = await prisma.$executeRawUnsafe(
      `UPDATE Depense SET montantPaye = montant, statutPaiement = 'PAYE' WHERE montantPaye = 0 AND statutPaiement = 'PAYE'`
    )
    console.log(`  Depense: ${uDepense} enregistrement(s) mis à jour`)
  } catch (e) {
    if (e.message && e.message.includes('no such table')) {
      console.log('  Depense: table absente, ignorée')
    } else {
      throw e
    }
  }

  console.log('Terminé.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
