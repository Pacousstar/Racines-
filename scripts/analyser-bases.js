/**
 * Analyse complète des bases de données GestiCom
 * Compare la base actuelle et la base de production
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

const bases = [
  { nom: 'Base actuelle', chemin: path.resolve(__dirname, '..', 'prisma', 'gesticom.db') },
  { nom: 'Base production', chemin: path.resolve(__dirname, '..', 'docs', 'gesticom_production.db') }
]

function formatNombre(n) {
  return n.toLocaleString('fr-FR')
}

function formatMontant(m) {
  return m ? `${m.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA` : '0 FCFA'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : 'N/A'
}

async function analyserBase(nom, dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`\n❌ ${nom}: Fichier non trouvé`)
    console.log(`   Chemin: ${dbPath}`)
    return null
  }

  try {
    const sizeKo = Math.round(fs.statSync(dbPath).size / 1024)
    const sizeMo = (sizeKo / 1024).toFixed(2)
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`
    const prisma = new PrismaClient()

    console.log(`\n${'='.repeat(80)}`)
    console.log(`📊 ${nom.toUpperCase()}`)
    console.log(`${'='.repeat(80)}`)
    console.log(`📁 Chemin: ${dbPath}`)
    console.log(`💾 Taille: ${sizeKo} Ko (${sizeMo} Mo)`)
    console.log('')

    // ===== ENTITÉS =====
    const entites = await prisma.entite.findMany()
    const entitesActives = entites.filter(e => e.active).length
    console.log(`🏢 ENTITÉS`)
    console.log(`   Total: ${entites.length} (${entitesActives} actives)`)
    entites.forEach(e => {
      console.log(`   - ${e.code}: ${e.nom} (${e.type}) - ${e.active ? '✅' : '❌'}`)
    })
    console.log('')

    // ===== MAGASINS =====
    const magasins = await prisma.magasin.findMany()
    const magasinsActifs = magasins.filter(m => m.actif).length
    console.log(`🏪 MAGASINS`)
    console.log(`   Total: ${magasins.length} (${magasinsActifs} actifs)`)
    magasins.forEach(m => {
      const entite = entites.find(e => e.id === m.entiteId)
      console.log(`   - ${m.code}: ${m.nom} (${entite?.nom || 'N/A'}) - ${m.actif ? '✅' : '❌'}`)
    })
    console.log('')

    // ===== UTILISATEURS =====
    const utilisateurs = await prisma.utilisateur.findMany({
      select: {
        id: true,
        login: true,
        nom: true,
        role: true,
        actif: true
      }
    })
    const utilisateursActifs = utilisateurs.filter(u => u.actif).length
    const roles = {}
    utilisateurs.forEach(u => {
      roles[u.role] = (roles[u.role] || 0) + 1
    })
    console.log(`👥 UTILISATEURS`)
    console.log(`   Total: ${utilisateurs.length} (${utilisateursActifs} actifs)`)
    Object.entries(roles).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count}`)
    })
    console.log('')

    // ===== PRODUITS =====
    const produits = await prisma.produit.findMany()
    const produitsActifs = produits.filter(p => p.actif).length
    const produitsAvecPrixAchat = produits.filter(p => p.prixAchat && p.prixAchat > 0).length
    const produitsAvecPrixVente = produits.filter(p => p.prixVente && p.prixVente > 0).length
    const produitsSansPrixAchat = produits.filter(p => !p.prixAchat || p.prixAchat === 0).length
    const produitsSansPrixVente = produits.filter(p => !p.prixVente || p.prixVente === 0).length
    
    const categories = {}
    produits.forEach(p => {
      categories[p.categorie] = (categories[p.categorie] || 0) + 1
    })
    
    const totalPrixAchat = produits.reduce((sum, p) => sum + (p.prixAchat || 0), 0)
    const totalPrixVente = produits.reduce((sum, p) => sum + (p.prixVente || 0), 0)
    const moyennePrixAchat = produitsAvecPrixAchat > 0 ? totalPrixAchat / produitsAvecPrixAchat : 0
    const moyennePrixVente = produitsAvecPrixVente > 0 ? totalPrixVente / produitsAvecPrixVente : 0

    console.log(`📦 PRODUITS`)
    console.log(`   Total: ${formatNombre(produits.length)} (${produitsActifs} actifs)`)
    console.log(`   Avec prix d'achat: ${produitsAvecPrixAchat} (${produitsSansPrixAchat} sans prix)`)
    console.log(`   Avec prix de vente: ${produitsAvecPrixVente} (${produitsSansPrixVente} sans prix)`)
    console.log(`   Prix moyen d'achat: ${formatMontant(moyennePrixAchat)}`)
    console.log(`   Prix moyen de vente: ${formatMontant(moyennePrixVente)}`)
    console.log(`   Top 5 catégories:`)
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([cat, count]) => {
        console.log(`      - ${cat}: ${count}`)
      })
    console.log('')

    // ===== STOCKS =====
    const stocks = await prisma.stock.findMany({
      select: {
        id: true,
        produitId: true,
        magasinId: true,
        quantite: true,
        quantiteInitiale: true
      }
    })
    const stocksAvecQte = stocks.filter(s => s.quantite > 0).length
    const stocksAvecQteInitiale = stocks.filter(s => s.quantiteInitiale > 0).length
    const totalQuantite = stocks.reduce((sum, s) => sum + s.quantite, 0)
    const totalQuantiteInitiale = stocks.reduce((sum, s) => sum + s.quantiteInitiale, 0)
    const valeurStock = stocks.reduce((sum, s) => {
      const produit = produits.find(p => p.id === s.produitId)
      const prix = produit?.prixAchat || 0
      return sum + (s.quantite * prix)
    }, 0)

    console.log(`📊 STOCKS`)
    console.log(`   Total lignes: ${formatNombre(stocks.length)}`)
    console.log(`   Avec quantité > 0: ${stocksAvecQte}`)
    console.log(`   Avec quantité initiale > 0: ${stocksAvecQteInitiale}`)
    console.log(`   Total quantité courante: ${formatNombre(totalQuantite)}`)
    console.log(`   Total quantité initiale: ${formatNombre(totalQuantiteInitiale)}`)
    console.log(`   Valeur estimée du stock: ${formatMontant(valeurStock)}`)
    console.log('')

    // ===== CLIENTS =====
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        nom: true,
        type: true,
        plafondCredit: true,
        actif: true
      }
    }).catch(() => [])
    const clientsActifs = clients.filter(c => c.actif).length
    const clientsCredit = clients.filter(c => c.type === 'CREDIT').length
    const clientsCash = clients.filter(c => c.type === 'CASH').length
    const totalPlafondCredit = clients.reduce((sum, c) => sum + (c.plafondCredit || 0), 0)

    console.log(`👤 CLIENTS`)
    console.log(`   Total: ${clients.length} (${clientsActifs} actifs)`)
    console.log(`   Type CREDIT: ${clientsCredit}`)
    console.log(`   Type CASH: ${clientsCash}`)
    console.log(`   Plafond crédit total: ${formatMontant(totalPlafondCredit)}`)
    console.log('')

    // ===== FOURNISSEURS =====
    const fournisseurs = await prisma.fournisseur.findMany({
      select: {
        id: true,
        nom: true,
        actif: true
      }
    }).catch(() => [])
    const fournisseursActifs = fournisseurs.filter(f => f.actif).length
    console.log(`🏭 FOURNISSEURS`)
    console.log(`   Total: ${fournisseurs.length} (${fournisseursActifs} actifs)`)
    console.log('')

    // ===== VENTES =====
    const ventes = await prisma.vente.findMany({
      select: {
        id: true,
        numero: true,
        date: true,
        montantTotal: true,
        montantPaye: true,
        statutPaiement: true,
        statut: true
      }
    }).catch(() => [])
    const ventesValidees = ventes.filter(v => v.statut === 'VALIDEE').length
    const ventesAnnulees = ventes.filter(v => v.statut === 'ANNULEE').length
    const totalVentes = ventes.reduce((sum, v) => sum + v.montantTotal, 0)
    const totalPaye = ventes.reduce((sum, v) => sum + v.montantPaye, 0)
    const totalCreditVentes = totalVentes - totalPaye
    
    const ventesParStatut = {}
    ventes.forEach(v => {
      ventesParStatut[v.statutPaiement] = (ventesParStatut[v.statutPaiement] || 0) + 1
    })

    const ventesLignes = await prisma.venteLigne.findMany({
      select: {
        id: true,
        quantite: true
      }
    }).catch(() => [])
    const totalQuantiteVendue = ventesLignes.reduce((sum, l) => sum + l.quantite, 0)

    // Dates
    const datesVentes = ventes.map(v => new Date(v.date))
    const datePremiereVente = datesVentes.length > 0 ? new Date(Math.min(...datesVentes.map(d => d.getTime()))) : null
    const dateDerniereVente = datesVentes.length > 0 ? new Date(Math.max(...datesVentes.map(d => d.getTime()))) : null

    console.log(`💰 VENTES`)
    console.log(`   Total: ${formatNombre(ventes.length)} (${ventesValidees} validées, ${ventesAnnulees} annulées)`)
    console.log(`   Montant total: ${formatMontant(totalVentes)}`)
    console.log(`   Montant payé: ${formatMontant(totalPaye)}`)
    console.log(`   Montant crédit: ${formatMontant(totalCreditVentes)}`)
    console.log(`   Quantité totale vendue: ${formatNombre(totalQuantiteVendue)}`)
    console.log(`   Période: ${formatDate(datePremiereVente)} → ${formatDate(dateDerniereVente)}`)
    console.log(`   Statuts paiement:`)
    Object.entries(ventesParStatut).forEach(([statut, count]) => {
      console.log(`      - ${statut}: ${count}`)
    })
    console.log('')

    // ===== ACHATS =====
    const achats = await prisma.achat.findMany({
      select: {
        id: true,
        numero: true,
        date: true,
        montantTotal: true,
        montantPaye: true
      }
    }).catch(() => [])
    const totalAchats = achats.reduce((sum, a) => sum + a.montantTotal, 0)
    const totalPayeAchats = achats.reduce((sum, a) => sum + a.montantPaye, 0)
    const totalCreditAchats = totalAchats - totalPayeAchats

    const achatsLignes = await prisma.achatLigne.findMany({
      select: {
        id: true,
        quantite: true
      }
    }).catch(() => [])
    const totalQuantiteAchetee = achatsLignes.reduce((sum, l) => sum + l.quantite, 0)

    const datesAchats = achats.map(a => new Date(a.date))
    const datePremierAchat = datesAchats.length > 0 ? new Date(Math.min(...datesAchats.map(d => d.getTime()))) : null
    const dateDernierAchat = datesAchats.length > 0 ? new Date(Math.max(...datesAchats.map(d => d.getTime()))) : null

    console.log(`🛒 ACHATS`)
    console.log(`   Total: ${formatNombre(achats.length)}`)
    console.log(`   Montant total: ${formatMontant(totalAchats)}`)
    console.log(`   Montant payé: ${formatMontant(totalPayeAchats)}`)
    console.log(`   Montant crédit: ${formatMontant(totalCreditAchats)}`)
    console.log(`   Quantité totale achetée: ${formatNombre(totalQuantiteAchetee)}`)
    console.log(`   Période: ${formatDate(datePremierAchat)} → ${formatDate(dateDernierAchat)}`)
    console.log('')

    // ===== MOUVEMENTS =====
    const mouvements = await prisma.mouvement.findMany({
      select: {
        id: true,
        type: true,
        quantite: true
      }
    }).catch(() => [])
    const mouvementsEntree = mouvements.filter(m => m.type === 'ENTREE').length
    const mouvementsSortie = mouvements.filter(m => m.type === 'SORTIE').length
    const totalEntree = mouvements.filter(m => m.type === 'ENTREE').reduce((sum, m) => sum + m.quantite, 0)
    const totalSortie = mouvements.filter(m => m.type === 'SORTIE').reduce((sum, m) => sum + m.quantite, 0)

    console.log(`🔄 MOUVEMENTS DE STOCK`)
    console.log(`   Total: ${formatNombre(mouvements.length)}`)
    console.log(`   Entrées: ${mouvementsEntree} (${formatNombre(totalEntree)} unités)`)
    console.log(`   Sorties: ${mouvementsSortie} (${formatNombre(totalSortie)} unités)`)
    console.log('')

    // ===== CAISSE =====
    const caisse = await prisma.caisse.findMany({
      select: {
        id: true,
        type: true,
        montant: true
      }
    }).catch(() => [])
    const caisseEntree = caisse.filter(c => c.type === 'ENTREE').reduce((sum, c) => sum + c.montant, 0)
    const caisseSortie = caisse.filter(c => c.type === 'SORTIE').reduce((sum, c) => sum + c.montant, 0)
    const soldeCaisse = caisseEntree - caisseSortie

    console.log(`💵 CAISSE`)
    console.log(`   Total opérations: ${formatNombre(caisse.length)}`)
    console.log(`   Entrées: ${formatMontant(caisseEntree)}`)
    console.log(`   Sorties: ${formatMontant(caisseSortie)}`)
    console.log(`   Solde: ${formatMontant(soldeCaisse)}`)
    console.log('')

    // ===== DÉPENSES =====
    const depenses = await prisma.depense.findMany({
      select: {
        id: true,
        categorie: true,
        montant: true,
        montantPaye: true
      }
    }).catch(() => [])
    const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0)
    const totalDepensesPayees = depenses.reduce((sum, d) => sum + d.montantPaye, 0)
    
    const depensesParCategorie = {}
    depenses.forEach(d => {
      depensesParCategorie[d.categorie] = (depensesParCategorie[d.categorie] || 0) + d.montant
    })

    console.log(`💸 DÉPENSES`)
    console.log(`   Total: ${formatNombre(depenses.length)}`)
    console.log(`   Montant total: ${formatMontant(totalDepenses)}`)
    console.log(`   Montant payé: ${formatMontant(totalDepensesPayees)}`)
    console.log(`   Par catégorie:`)
    Object.entries(depensesParCategorie)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, montant]) => {
        console.log(`      - ${cat}: ${formatMontant(montant)}`)
      })
    console.log('')

    // ===== CHARGES =====
    const charges = await prisma.charge.findMany({
      select: {
        id: true,
        type: true,
        rubrique: true,
        montant: true
      }
    }).catch(() => [])
    const totalCharges = charges.reduce((sum, c) => sum + c.montant, 0)
    const chargesFixes = charges.filter(c => c.type === 'FIXE').reduce((sum, c) => sum + c.montant, 0)
    const chargesVariables = charges.filter(c => c.type === 'VARIABLE').reduce((sum, c) => sum + c.montant, 0)
    
    const chargesParRubrique = {}
    charges.forEach(c => {
      chargesParRubrique[c.rubrique] = (chargesParRubrique[c.rubrique] || 0) + c.montant
    })

    console.log(`⚡ CHARGES`)
    console.log(`   Total: ${formatNombre(charges.length)}`)
    console.log(`   Montant total: ${formatMontant(totalCharges)}`)
    console.log(`   Fixes: ${formatMontant(chargesFixes)}`)
    console.log(`   Variables: ${formatMontant(chargesVariables)}`)
    console.log(`   Par rubrique:`)
    Object.entries(chargesParRubrique)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([rub, montant]) => {
        console.log(`      - ${rub}: ${formatMontant(montant)}`)
      })
    console.log('')

    // ===== COMPTABILITÉ =====
    const planComptes = await prisma.planCompte.findMany().catch(() => [])
    const journaux = await prisma.journal.findMany().catch(() => [])
    const ecritures = await prisma.ecritureComptable.findMany({
      select: {
        id: true,
        debit: true,
        credit: true
      }
    }).catch(() => [])
    const totalDebit = ecritures.reduce((sum, e) => sum + e.debit, 0)
    const totalCreditComptable = ecritures.reduce((sum, e) => sum + e.credit, 0)

    console.log(`📚 COMPTABILITÉ`)
    console.log(`   Plan de comptes: ${planComptes.length} comptes`)
    console.log(`   Journaux: ${journaux.length}`)
    console.log(`   Écritures: ${formatNombre(ecritures.length)}`)
    console.log(`   Total débit: ${formatMontant(totalDebit)}`)
    console.log(`   Total crédit: ${formatMontant(totalCreditComptable)}`)
    console.log(`   Écart: ${formatMontant(Math.abs(totalDebit - totalCreditComptable))}`)
    console.log('')

    // ===== AUDIT =====
    const auditLogs = await prisma.auditLog.findMany().catch(() => [])
    const auditParAction = {}
    auditLogs.forEach(a => {
      auditParAction[a.action] = (auditParAction[a.action] || 0) + 1
    })

    console.log(`📝 AUDIT / TRAÇABILITÉ`)
    console.log(`   Total logs: ${formatNombre(auditLogs.length)}`)
    if (auditLogs.length > 0) {
      console.log(`   Par action:`)
      Object.entries(auditParAction)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([action, count]) => {
          console.log(`      - ${action}: ${count}`)
        })
    }
    console.log('')

    // ===== RÉSUMÉ FINANCIER =====
    console.log(`📈 RÉSUMÉ FINANCIER`)
    console.log(`   Chiffre d'affaires (ventes): ${formatMontant(totalVentes)}`)
    console.log(`   Coûts d'achat: ${formatMontant(totalAchats)}`)
    console.log(`   Dépenses: ${formatMontant(totalDepenses)}`)
    console.log(`   Charges: ${formatMontant(totalCharges)}`)
    const margeBrute = totalVentes - totalAchats
    const resultat = margeBrute - totalDepenses - totalCharges
    console.log(`   Marge brute: ${formatMontant(margeBrute)}`)
    console.log(`   Résultat net: ${formatMontant(resultat)}`)
    console.log('')

    await prisma.$disconnect()

    return {
      nom,
      taille: sizeKo,
      produits: produits.length,
      ventes: ventes.length,
      achats: achats.length,
      totalVentes,
      totalAchats
    }
  } catch (e) {
    console.log(`\n❌ Erreur lors de l'analyse: ${e.message}`)
    console.log(`   ${e.stack}`)
    return null
  }
}

async function main() {
  console.log('')
  console.log('='.repeat(80))
  console.log('📊 ANALYSE COMPLÈTE DES BASES DE DONNÉES GESTICOM')
  console.log('='.repeat(80))
  console.log('')

  const resultats = []

  for (const base of bases) {
    const resultat = await analyserBase(base.nom, base.chemin)
    if (resultat) {
      resultats.push(resultat)
    }
  }

  // Comparaison
  if (resultats.length === 2) {
    console.log('')
    console.log('='.repeat(80))
    console.log('📊 COMPARAISON DES BASES')
    console.log('='.repeat(80))
    console.log('')
    
    const [actuelle, production] = resultats
    
    console.log(`📦 PRODUITS`)
    console.log(`   Base actuelle: ${formatNombre(actuelle.produits)}`)
    console.log(`   Base production: ${formatNombre(production.produits)}`)
    console.log(`   Différence: ${formatNombre(production.produits - actuelle.produits)}`)
    console.log('')
    
    console.log(`💰 VENTES`)
    console.log(`   Base actuelle: ${formatNombre(actuelle.ventes)} ventes (${formatMontant(actuelle.totalVentes)})`)
    console.log(`   Base production: ${formatNombre(production.ventes)} ventes (${formatMontant(production.totalVentes)})`)
    console.log('')
    
    console.log(`🛒 ACHATS`)
    console.log(`   Base actuelle: ${formatNombre(actuelle.achats)} achats (${formatMontant(actuelle.totalAchats)})`)
    console.log(`   Base production: ${formatNombre(production.achats)} achats (${formatMontant(production.totalAchats)})`)
    console.log('')
  }

  console.log('')
  console.log('='.repeat(80))
  console.log('✨ Analyse terminée')
  console.log('='.repeat(80))
  console.log('')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
