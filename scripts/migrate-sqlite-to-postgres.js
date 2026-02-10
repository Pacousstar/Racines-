/**
 * Script de migration SQLite → PostgreSQL
 * 
 * Ce script migre toutes les données de la base SQLite vers PostgreSQL.
 * 
 * Usage:
 * 1. Configurer DATABASE_URL_SQLITE et DATABASE_URL_POSTGRES dans .env
 * 2. Exécuter: node scripts/migrate-sqlite-to-postgres.js
 */

const { PrismaClient: SQLiteClient } = require('@prisma/client')
const { PrismaClient: PostgresClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

// Charger les variables d'environnement
const envPath = path.join(__dirname, '..', '.env')
let sqliteUrl = 'file:C:/gesticom/gesticom.db'
let postgresUrl = process.env.DATABASE_URL_POSTGRES

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  const sqliteMatch = content.match(/DATABASE_URL\s*=\s*["']?([^"'\n\r]+)["']?/)
  const postgresMatch = content.match(/DATABASE_URL_POSTGRES\s*=\s*["']?([^"'\n\r]+)["']?/)
  
  if (sqliteMatch) {
    sqliteUrl = sqliteMatch[1].trim()
  }
  if (postgresMatch) {
    postgresUrl = postgresMatch[1].trim()
  }
}

if (!postgresUrl) {
  console.error('❌ DATABASE_URL_POSTGRES non défini dans .env')
  console.error('Ajoutez: DATABASE_URL_POSTGRES="postgresql://user:password@host:5432/database"')
  process.exit(1)
}

// Créer les clients Prisma
const sqlite = new SQLiteClient({
  datasources: {
    db: {
      url: sqliteUrl,
    },
  },
})

const postgres = new PostgresClient({
  datasources: {
    db: {
      url: postgresUrl,
    },
  },
})

async function migrate() {
  console.log('🔄 Migration SQLite → PostgreSQL')
  console.log('='.repeat(80))
  console.log('')
  console.log(`📦 Source SQLite: ${sqliteUrl}`)
  console.log(`📦 Destination PostgreSQL: ${postgresUrl.replace(/:[^:@]+@/, ':****@')}`)
  console.log('')

  try {
    // Vérifier la connexion PostgreSQL
    console.log('🔍 Vérification de la connexion PostgreSQL...')
    await postgres.$queryRaw`SELECT 1`
    console.log('✅ Connexion PostgreSQL OK')
    console.log('')

    // Vérifier que la base PostgreSQL est vide (ou demander confirmation)
    const entiteCount = await postgres.entite.count()
    if (entiteCount > 0) {
      console.warn('⚠️  La base PostgreSQL contient déjà des données!')
      console.warn('   La migration va ajouter les données SQLite aux données existantes.')
      console.warn('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes pour continuer...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    // Migrer dans l'ordre des dépendances
    console.log('📊 Migration des données...')
    console.log('')

    // 1. Entites
    console.log('1️⃣  Migration des Entités...')
    const entites = await sqlite.entite.findMany()
    for (const entite of entites) {
      await postgres.entite.upsert({
        where: { code: entite.code },
        update: {
          nom: entite.nom,
          type: entite.type,
          localisation: entite.localisation,
          active: entite.active,
        },
        create: entite,
      })
    }
    console.log(`   ✅ ${entites.length} entités migrées`)

    // 2. Utilisateurs
    console.log('2️⃣  Migration des Utilisateurs...')
    const utilisateurs = await sqlite.utilisateur.findMany()
    for (const user of utilisateurs) {
      await postgres.utilisateur.upsert({
        where: { login: user.login },
        update: {
          nom: user.nom,
          email: user.email,
          motDePasse: user.motDePasse,
          role: user.role,
          permissionsPersonnalisees: user.permissionsPersonnalisees,
          entiteId: user.entiteId,
          actif: user.actif,
        },
        create: user,
      })
    }
    console.log(`   ✅ ${utilisateurs.length} utilisateurs migrés`)

    // 3. Magasins
    console.log('3️⃣  Migration des Magasins...')
    const magasins = await sqlite.magasin.findMany()
    for (const magasin of magasins) {
      await postgres.magasin.upsert({
        where: { code: magasin.code },
        update: {
          nom: magasin.nom,
          localisation: magasin.localisation,
          entiteId: magasin.entiteId,
          actif: magasin.actif,
        },
        create: magasin,
      })
    }
    console.log(`   ✅ ${magasins.length} magasins migrés`)

    // 4. Produits
    console.log('4️⃣  Migration des Produits...')
    const produits = await sqlite.produit.findMany()
    let produitsMigres = 0
    for (const produit of produits) {
      try {
        await postgres.produit.upsert({
          where: { code: produit.code },
          update: {
            designation: produit.designation,
            categorie: produit.categorie,
            prixAchat: produit.prixAchat,
            prixVente: produit.prixVente,
            seuilMin: produit.seuilMin,
            actif: produit.actif,
          },
          create: produit,
        })
        produitsMigres++
      } catch (e) {
        console.warn(`   ⚠️  Erreur sur produit ${produit.code}: ${e.message}`)
      }
    }
    console.log(`   ✅ ${produitsMigres}/${produits.length} produits migrés`)

    // 5. Stocks
    console.log('5️⃣  Migration des Stocks...')
    const stocks = await sqlite.stock.findMany()
    for (const stock of stocks) {
      await postgres.stock.upsert({
        where: {
          produitId_magasinId: {
            produitId: stock.produitId,
            magasinId: stock.magasinId,
          },
        },
        update: {
          quantite: stock.quantite,
          quantiteInitiale: stock.quantiteInitiale,
        },
        create: stock,
      })
    }
    console.log(`   ✅ ${stocks.length} stocks migrés`)

    // 6. Clients
    console.log('6️⃣  Migration des Clients...')
    const clients = await sqlite.client.findMany()
    for (const client of clients) {
      await postgres.client.create({
        data: client,
      })
    }
    console.log(`   ✅ ${clients.length} clients migrés`)

    // 7. Fournisseurs
    console.log('7️⃣  Migration des Fournisseurs...')
    const fournisseurs = await sqlite.fournisseur.findMany()
    for (const fournisseur of fournisseurs) {
      await postgres.fournisseur.create({
        data: fournisseur,
      })
    }
    console.log(`   ✅ ${fournisseurs.length} fournisseurs migrés`)

    // 8. Ventes et VenteLignes
    console.log('8️⃣  Migration des Ventes...')
    const ventes = await sqlite.vente.findMany({
      include: { lignes: true },
    })
    for (const vente of ventes) {
      const { lignes, ...venteData } = vente
      await postgres.vente.create({
        data: {
          ...venteData,
          lignes: {
            create: lignes.map(l => ({
              produitId: l.produitId,
              designation: l.designation,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              montant: l.montant,
            })),
          },
        },
      })
    }
    console.log(`   ✅ ${ventes.length} ventes migrées`)

    // 9. Achats et AchatLignes
    console.log('9️⃣  Migration des Achats...')
    const achats = await sqlite.achat.findMany({
      include: { lignes: true },
    })
    for (const achat of achats) {
      const { lignes, ...achatData } = achat
      await postgres.achat.create({
        data: {
          ...achatData,
          lignes: {
            create: lignes.map(l => ({
              produitId: l.produitId,
              designation: l.designation,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              montant: l.montant,
            })),
          },
        },
      })
    }
    console.log(`   ✅ ${achats.length} achats migrés`)

    // 10. Mouvements
    console.log('🔟 Migration des Mouvements...')
    const mouvements = await sqlite.mouvement.findMany()
    for (const mouvement of mouvements) {
      await postgres.mouvement.create({
        data: mouvement,
      })
    }
    console.log(`   ✅ ${mouvements.length} mouvements migrés`)

    // 11. Charges
    console.log('1️⃣1️⃣ Migration des Charges...')
    const charges = await sqlite.charge.findMany()
    for (const charge of charges) {
      await postgres.charge.create({
        data: charge,
      })
    }
    console.log(`   ✅ ${charges.length} charges migrées`)

    // 12. Depenses
    console.log('1️⃣2️⃣ Migration des Dépenses...')
    const depenses = await sqlite.depense.findMany()
    for (const depense of depenses) {
      await postgres.depense.create({
        data: depense,
      })
    }
    console.log(`   ✅ ${depenses.length} dépenses migrées`)

    // 13. Caisse
    console.log('1️⃣3️⃣ Migration des Opérations de Caisse...')
    const caisseOps = await sqlite.caisse.findMany()
    for (const op of caisseOps) {
      await postgres.caisse.create({
        data: op,
      })
    }
    console.log(`   ✅ ${caisseOps.length} opérations de caisse migrées`)

    // 14. Banques
    console.log('1️⃣4️⃣ Migration des Banques...')
    const banques = await sqlite.banque.findMany()
    for (const banque of banques) {
      await postgres.banque.create({
        data: banque,
      })
    }
    console.log(`   ✅ ${banques.length} banques migrées`)

    // 15. Operations Bancaires
    console.log('1️⃣5️⃣ Migration des Opérations Bancaires...')
    const operationsBancaires = await sqlite.operationBancaire.findMany()
    for (const op of operationsBancaires) {
      await postgres.operationBancaire.create({
        data: op,
      })
    }
    console.log(`   ✅ ${operationsBancaires.length} opérations bancaires migrées`)

    // 16. Audit Logs
    console.log('1️⃣6️⃣ Migration des Logs d'Audit...')
    const auditLogs = await sqlite.auditLog.findMany()
    for (const log of auditLogs) {
      await postgres.auditLog.create({
        data: log,
      })
    }
    console.log(`   ✅ ${auditLogs.length} logs d'audit migrés`)

    // 17. Plan de Comptes
    console.log('1️⃣7️⃣ Migration du Plan de Comptes...')
    const planComptes = await sqlite.planCompte.findMany()
    for (const compte of planComptes) {
      await postgres.planCompte.upsert({
        where: { numero: compte.numero },
        update: {
          libelle: compte.libelle,
          classe: compte.classe,
          type: compte.type,
          actif: compte.actif,
        },
        create: compte,
      })
    }
    console.log(`   ✅ ${planComptes.length} comptes migrés`)

    // 18. Journaux
    console.log('1️⃣8️⃣ Migration des Journaux...')
    const journaux = await sqlite.journal.findMany()
    for (const journal of journaux) {
      await postgres.journal.upsert({
        where: { code: journal.code },
        update: {
          libelle: journal.libelle,
          type: journal.type,
          actif: journal.actif,
        },
        create: journal,
      })
    }
    console.log(`   ✅ ${journaux.length} journaux migrés`)

    // 19. Ecritures Comptables
    console.log('1️⃣9️⃣ Migration des Écritures Comptables...')
    const ecritures = await sqlite.ecritureComptable.findMany()
    for (const ecriture of ecritures) {
      await postgres.ecritureComptable.create({
        data: ecriture,
      })
    }
    console.log(`   ✅ ${ecritures.length} écritures comptables migrées`)

    // 20. Parametres
    console.log('2️⃣0️⃣ Migration des Paramètres...')
    const parametres = await sqlite.parametre.findMany()
    if (parametres.length > 0) {
      const param = parametres[0]
      await postgres.parametre.upsert({
        where: { id: 1 },
        update: {
          nomEntreprise: param.nomEntreprise,
          contact: param.contact,
          localisation: param.localisation,
          devise: param.devise,
          tvaParDefaut: param.tvaParDefaut,
          logo: param.logo,
        },
        create: param,
      })
      console.log(`   ✅ Paramètres migrés`)
    }

    // 21. Dashboard Preferences
    console.log('2️⃣1️⃣ Migration des Préférences Dashboard...')
    const prefs = await sqlite.dashboardPreference.findMany()
    for (const pref of prefs) {
      await postgres.dashboardPreference.upsert({
        where: { utilisateurId: pref.utilisateurId },
        update: {
          widgets: pref.widgets,
          periode: pref.periode,
        },
        create: pref,
      })
    }
    console.log(`   ✅ ${prefs.length} préférences migrées`)

    // 22. Print Templates
    console.log('2️⃣2️⃣ Migration des Templates d'Impression...')
    const templates = await sqlite.printTemplate.findMany()
    for (const template of templates) {
      await postgres.printTemplate.upsert({
        where: { id: template.id },
        update: {
          type: template.type,
          nom: template.nom,
          logo: template.logo,
          enTete: template.enTete,
          piedDePage: template.piedDePage,
          variables: template.variables,
          actif: template.actif,
        },
        create: template,
      })
    }
    console.log(`   ✅ ${templates.length} templates migrés`)

    console.log('')
    console.log('✅ Migration terminée avec succès!')
    console.log('')
    console.log('📊 Résumé:')
    console.log(`   - Entités: ${entites.length}`)
    console.log(`   - Utilisateurs: ${utilisateurs.length}`)
    console.log(`   - Magasins: ${magasins.length}`)
    console.log(`   - Produits: ${produitsMigres}/${produits.length}`)
    console.log(`   - Stocks: ${stocks.length}`)
    console.log(`   - Clients: ${clients.length}`)
    console.log(`   - Ventes: ${ventes.length}`)
    console.log(`   - Achats: ${achats.length}`)
    console.log(`   - Mouvements: ${mouvements.length}`)
    console.log('')
    console.log('🎉 Vos données sont maintenant dans PostgreSQL!')
    console.log('   Vous pouvez maintenant déployer sur Vercel.')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await sqlite.$disconnect()
    await postgres.$disconnect()
  }
}

migrate()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
