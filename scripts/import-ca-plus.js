/**
 * Importe les onglets "Nouveau produit" et "Nouvel achat" du fichier
 * docs/GestiCom CA+.xlsx dans la base (Produit, Stock, Achat, AchatLigne, Mouvement).
 * Données manquantes complétées par 0 (ou valeur par défaut).
 *
 * À lancer depuis la racine du projet : node scripts/import-ca-plus.js
 * Nécessite : .env avec DATABASE_URL, npx prisma generate
 */

const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx-prototype-pollution-fixed')
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const FILE_PATH = path.join(__dirname, '..', 'docs', 'GestiCom CA+.xlsx')

function excelSerialToDate(serial) {
  if (serial == null || serial === '') return new Date()
  const n = Number(serial)
  if (Number.isNaN(n)) return new Date(String(serial)) || new Date()
  const epoch = new Date(1899, 11, 30)
  return new Date(epoch.getTime() + n * 86400 * 1000)
}

async function main() {
  if (!require('fs').existsSync(FILE_PATH)) {
    console.error('Fichier introuvable:', FILE_PATH)
    process.exit(1)
  }

  const workbook = XLSX.readFile(FILE_PATH)
  const sheetProduit = workbook.Sheets['Nouveau produit']
  const sheetAchat = workbook.Sheets['Nouvel achat']

  if (!sheetProduit || !sheetAchat) {
    console.error('Onglets "Nouveau produit" et "Nouvel achat" requis.')
    process.exit(1)
  }

  const user = await prisma.utilisateur.findFirst({ where: { actif: true }, select: { id: true, entiteId: true } })
  if (!user) {
    console.error('Aucun utilisateur actif en base.')
    process.exit(1)
  }

  const magasins = await prisma.magasin.findMany({ where: { actif: true }, select: { id: true, code: true, nom: true } })
  const magasinByNom = new Map()
  magasins.forEach((m) => {
    magasinByNom.set(String(m.nom || '').trim().toUpperCase(), m.id)
    magasinByNom.set(String(m.code || '').trim().toUpperCase(), m.id)
  })
  const firstMagasinId = magasins[0]?.id

  // --- Onglet Nouveau produit : DATE=code, ENTREE=designation, QUANTITE=qté stock, LIEU=magasin ---
  const rowsProduit = XLSX.utils.sheet_to_json(sheetProduit)
  let createdProduits = 0
  let createdStocks = 0

  let rowIndexProduit = 0
  for (const row of rowsProduit) {
    rowIndexProduit++
    const codeRaw = String(row?.DATE ?? row?.date ?? '').trim()
    const designation = String(row?.ENTREE ?? row?.entree ?? '').trim()
    const quantite = Math.max(0, Math.floor(Number(row?.QUANTITE ?? row?.quantite ?? 0) || 0))
    const lieu = String(row?.LIEU ?? row?.lieu ?? '').trim()

    if (!designation) continue

    const codeStr = (codeRaw ? codeRaw + '-' : '') + String(designation).replace(/\s+/g, '-').slice(0, 20).toUpperCase() || 'P' + rowIndexProduit
    const codeFinal = codeStr.length > 2 ? codeStr : 'P' + rowIndexProduit
    let produit = await prisma.produit.findUnique({ where: { code: codeFinal } })
    if (!produit) {
      let uniqueCode = codeFinal
      let suffix = 0
      while (await prisma.produit.findUnique({ where: { code: uniqueCode } })) {
        suffix++
        uniqueCode = codeFinal + '-' + suffix
      }
      produit = await prisma.produit.create({
        data: {
          code: uniqueCode,
          designation,
          categorie: 'DIVERS',
          prixAchat: 0,
          prixVente: 0,
          seuilMin: 5,
          actif: true,
        },
      })
      createdProduits++
    }

    const magasinId = lieu ? (magasinByNom.get(lieu.toUpperCase()) ?? firstMagasinId) : firstMagasinId
    if (!magasinId) continue

    const existingStock = await prisma.stock.findUnique({
      where: { produitId_magasinId: { produitId: produit.id, magasinId } },
    })
    if (!existingStock) {
      await prisma.stock.create({
        data: {
          produitId: produit.id,
          magasinId,
          quantite: quantite || 0,
          quantiteInitiale: 0,
        },
      })
      createdStocks++
    } else {
      await prisma.stock.update({
        where: { id: existingStock.id },
        data: { quantite: { increment: quantite || 0 } },
      })
    }
  }

  console.log('Nouveau produit :', createdProduits, 'produit(s) créé(s),', createdStocks, 'stock(s) créé(s).')

  // --- Onglet Nouvel achat : ligne 1 = en-têtes (DATE, LIBELLE, LIEU, QUANTITE, PRIX DE VENTE), données à partir de ligne 2 ---
  const rowsAchat = XLSX.utils.sheet_to_json(sheetAchat, { header: 1 })
  const headerRow = rowsAchat[1] || rowsAchat[0] || []
  const colDate = headerRow.indexOf('DATE') >= 0 ? headerRow.indexOf('DATE') : 0
  const colLibelle = headerRow.indexOf('LIBELLE') >= 0 ? headerRow.indexOf('LIBELLE') : 1
  const colLieu = headerRow.indexOf('LIEU') >= 0 ? headerRow.indexOf('LIEU') : 2
  const colQuantite = headerRow.indexOf('QUANTITE') >= 0 ? headerRow.indexOf('QUANTITE') : 3
  const colPrix = headerRow.findIndex((h) => String(h || '').toUpperCase().includes('PRIX')) >= 0
    ? headerRow.findIndex((h) => String(h || '').toUpperCase().includes('PRIX'))
    : 4

  let createdAchats = 0
  const produitsByDesignation = new Map()
  let produits = await prisma.produit.findMany({ select: { id: true, designation: true, code: true } })
  const refreshProduits = async () => {
    produits = await prisma.produit.findMany({ select: { id: true, designation: true, code: true } })
    produitsByDesignation.clear()
    produits.forEach((p) => {
      produitsByDesignation.set(String(p.designation || '').trim().toUpperCase(), p)
      produitsByDesignation.set(String(p.code || '').trim().toUpperCase(), p)
    })
  }
  await refreshProduits()

  for (let i = 2; i < rowsAchat.length; i++) {
    const row = rowsAchat[i]
    if (!Array.isArray(row) || row.length === 0) continue

    const dateVal = row[colDate]
    const libelle = String(row[colLibelle] ?? '').trim()
    const lieu = String(row[colLieu] ?? '').trim()
    const quantite = Math.max(1, Math.floor(Number(row[colQuantite]) || 0))
    const prixUnitaire = Math.max(0, Number(row[colPrix]) || 0)

    if (!libelle) continue

    const dateAchat = excelSerialToDate(dateVal)
    const magasinId = lieu ? (magasinByNom.get(lieu.toUpperCase()) ?? firstMagasinId) : firstMagasinId
    if (!magasinId) continue

    let produit = produitsByDesignation.get(libelle.toUpperCase())
    if (!produit) {
      produit = produits.find((p) => String(p.code) === libelle || String(p.designation) === libelle) || null
    }
    if (!produit) {
      const codeProduit = String(libelle).replace(/\s+/g, '-').slice(0, 30).toUpperCase() || 'IMP-' + i
      const existCode = await prisma.produit.findUnique({ where: { code: codeProduit } })
      const codeFinal = existCode ? codeProduit + '-' + i : codeProduit
      produit = await prisma.produit.create({
        data: {
          code: codeFinal,
          designation: libelle,
          categorie: 'DIVERS',
          prixAchat: 0,
          prixVente: prixUnitaire || 0,
          seuilMin: 5,
          actif: true,
        },
      })
      const magasinStockId = magasinId || firstMagasinId
      if (magasinStockId) {
        await prisma.stock.create({
          data: { produitId: produit.id, magasinId: magasinStockId, quantite: 0, quantiteInitiale: 0 },
        })
      }
      await refreshProduits()
    }

    const montant = quantite * prixUnitaire
    const numero = 'ACH-' + Date.now() + '-' + i

    await prisma.achat.create({
      data: {
        numero,
        date: dateAchat,
        magasinId,
        entiteId: user.entiteId,
        utilisateurId: user.id,
        fournisseurId: null,
        fournisseurLibre: null,
        montantTotal: montant,
        montantPaye: montant,
        statutPaiement: 'PAYE',
        modePaiement: 'ESPECES',
        observation: 'Import GestiCom CA+.xlsx',
        lignes: {
          create: {
            produitId: produit.id,
            designation: produit.designation,
            quantite,
            prixUnitaire,
            montant,
          },
        },
      },
    })

    let stock = await prisma.stock.findUnique({
      where: { produitId_magasinId: { produitId: produit.id, magasinId } },
    })
    if (!stock) {
      stock = await prisma.stock.create({
        data: { produitId: produit.id, magasinId, quantite: 0, quantiteInitiale: 0 },
      })
    }
    await prisma.stock.update({
      where: { id: stock.id },
      data: { quantite: { increment: quantite } },
    })
    await prisma.mouvement.create({
      data: {
        date: dateAchat,
        type: 'ENTREE',
        produitId: produit.id,
        magasinId,
        entiteId: user.entiteId,
        utilisateurId: user.id,
        quantite,
        observation: 'Import achat ' + numero,
      },
    })

    createdAchats++
    if (createdAchats % 20 === 0) console.log('  Achats traités :', createdAchats)
  }

  console.log('Nouvel achat :', createdAchats, 'achat(s) créé(s).')
  console.log('Terminé.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
