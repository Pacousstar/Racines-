const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Mise à zéro de tous les prix de vente...');
  
  // Récupérer tous les produits
  const produits = await prisma.produit.findMany({
    where: {
      prixVente: {
        not: null,
        not: 0,
      },
    },
  });

  console.log(`Trouvé ${produits.length} produits avec un prix de vente > 0`);

  // Mettre tous les prix de vente à 0
  const result = await prisma.produit.updateMany({
    data: {
      prixVente: 0,
    },
  });

  console.log(`\nMise à jour terminée: ${result.count} produit(s) mis à jour`);
  console.log('Tous les prix de vente sont maintenant à 0.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
