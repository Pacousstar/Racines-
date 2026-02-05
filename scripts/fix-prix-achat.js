const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Correction des prix d\'achat depuis les prix de vente...')
  
  const produits = await prisma.produit.findMany({
    where: {
      prixVente: { not: null },
      OR: [
        { prixAchat: null },
        { prixAchat: 0 }
      ]
    },
    select: {
      id: true,
      code: true,
      designation: true,
      prixAchat: true,
      prixVente: true,
    }
  })

  console.log(`Trouvé ${produits.length} produits à corriger`)

  let updated = 0
  for (const p of produits) {
    if (p.prixVente != null) {
      await prisma.produit.update({
        where: { id: p.id },
        data: { prixAchat: p.prixVente }
      })
      updated++
      console.log(`✓ ${p.code}: prixAchat = ${p.prixVente} (depuis prixVente)`)
    }
  }

  console.log(`\nCorrection terminée: ${updated} produit(s) mis à jour`)
}

main()
  .catch((e) => {
    console.error('Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
