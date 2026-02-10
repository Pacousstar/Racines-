/**
 * Analyse complète de l'ancienne base (gesticomold.db) pour récapitulatif
 * des enregistrements à reprendre avant fusion avec la nouvelle version.
 * Usage : node scripts/analyser-bd-ancienne.js
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const oldDbPath = path.join(projectRoot, 'docs', 'gesticomold.db')

if (!fs.existsSync(oldDbPath)) {
  console.error('Fichier introuvable :', oldDbPath)
  process.exit(1)
}

// Point Prisma vers l'ancienne base
const dbUrl = 'file:' + oldDbPath.replace(/\\/g, '/')
process.env.DATABASE_URL = dbUrl

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })

function formatDate(d) {
  if (!d) return '-'
  const dt = new Date(d)
  return dt.toISOString().slice(0, 19).replace('T', ' ')
}

function formatMontant(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F'
}

async function run() {
  const lignes = []
  const push = (s) => { lignes.push(s); console.log(s) }

  push('')
  push('═══════════════════════════════════════════════════════════════════')
  push('  RÉCAPITULATIF COMPLET — Ancienne base (gesticomold.db)')
  push('═══════════════════════════════════════════════════════════════════')
  push('')

  try {
    // —— ENTITÉS ——
    const entites = await prisma.entite.findMany({ orderBy: { id: 'asc' } }).catch(() => [])
    push('── 1. ENTITÉS ──')
    push(`    Total : ${entites.length}`)
    entites.forEach((e) => push(`    - [${e.id}] ${e.code} | ${e.nom} | ${e.type} | ${e.localisation}`))
    push('')

    // —— MAGASINS ——
    const magasins = await prisma.magasin.findMany({ orderBy: { id: 'asc' } }).catch(() => [])
    push('── 2. MAGASINS ──')
    push(`    Total : ${magasins.length}`)
    magasins.forEach((m) => push(`    - [${m.id}] ${m.code} | ${m.nom} | ${m.localisation} | entiteId=${m.entiteId}`))
    push('')

    // —— UTILISATEURS ——
    const utilisateurs = await prisma.utilisateur.findMany({ orderBy: { id: 'asc' } }).catch(() => [])
    push('── 3. UTILISATEURS ──')
    push(`    Total : ${utilisateurs.length}`)
    utilisateurs.forEach((u) => push(`    - [${u.id}] ${u.login} | ${u.nom} | ${u.role} | actif=${u.actif} | entiteId=${u.entiteId}`))
    push('')

    // —— PRODUITS ——
    const produits = await prisma.produit.findMany({ orderBy: { id: 'asc' } }).catch(() => [])
    push('── 4. PRODUITS (catalogue) ──')
    push(`    Total : ${produits.length}`)
    const categories = {}
    produits.forEach((p) => { categories[p.categorie] = (categories[p.categorie] || 0) + 1 })
    push('    Répartition par catégorie :')
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => push(`      - ${cat} : ${n}`))
    push('    Liste des produits (code | désignation | catégorie | prix achat | prix vente) :')
    produits.forEach((p) => push(`    - [${p.id}] ${p.code} | ${p.designation} | ${p.categorie} | PA=${p.prixAchat ?? '-'} | PV=${p.prixVente ?? '-'}`))
    push('')

    // —— STOCKS ——
    const stocks = await prisma.stock.findMany({
      include: { produit: { select: { code: true, designation: true } }, magasin: { select: { code: true, nom: true } } },
      orderBy: [{ magasinId: 'asc' }, { produitId: 'asc' }],
    }).catch(() => [])
    push('── 5. STOCKS (par magasin / produit) ──')
    push(`    Total lignes : ${stocks.length}`)
    let totalQte = 0
    stocks.forEach((s) => {
      totalQte += s.quantite
      push(`    - Magasin ${s.magasin?.code ?? s.magasinId} | Produit ${s.produit?.code ?? s.produitId} | Qté=${s.quantite} | Qté init=${s.quantiteInitiale}`)
    })
    push(`    Somme des quantités (tous magasins) : ${totalQte}`)
    push('')

    // —— MOUVEMENTS DE STOCK ——
    const mouvements = await prisma.mouvement.findMany({
      include: { produit: { select: { code: true } }, magasin: { select: { code: true } } },
      orderBy: { date: 'desc' },
    }).catch(() => [])
    push('── 6. MOUVEMENTS DE STOCK ──')
    push(`    Total : ${mouvements.length}`)
    const entrées = mouvements.filter((m) => m.type === 'ENTREE')
    const sorties = mouvements.filter((m) => m.type === 'SORTIE')
    push(`    Entrées : ${entrées.length} | Sorties : ${sorties.length}`)
    mouvements.forEach((m) => push(`    - ${formatDate(m.date)} | ${m.type} | Mag=${m.magasin?.code ?? m.magasinId} | Prod=${m.produit?.code ?? m.produitId} | Qté=${m.quantite} | ${m.observation || '-'}`))
    push('')

    // —— CLIENTS ——
    const clients = await prisma.client.findMany({ orderBy: { id: 'asc' } }).catch(() => [])
    push('── 7. CLIENTS ──')
    push(`    Total : ${clients.length}`)
    clients.forEach((c) => push(`    - [${c.id}] ${c.nom} | ${c.telephone ?? '-'} | ${c.type} | actif=${c.actif}`))
    push('')

    // —— FOURNISSEURS ——
    const fournisseurs = await prisma.fournisseur.findMany({ orderBy: { id: 'asc' } }).catch(() => [])
    push('── 8. FOURNISSEURS ──')
    push(`    Total : ${fournisseurs.length}`)
    fournisseurs.forEach((f) => push(`    - [${f.id}] ${f.nom} | ${f.telephone ?? '-'} | ${f.email ?? '-'} | actif=${f.actif}`))
    push('')

    // —— VENTES ——
    const ventes = await prisma.vente.findMany({
      include: {
        magasin: { select: { code: true, nom: true } },
        client: { select: { nom: true } },
        utilisateur: { select: { login: true } },
        lignes: { include: { produit: { select: { code: true } } } },
      },
      orderBy: { date: 'desc' },
    }).catch(() => [])
    push('── 9. VENTES ──')
    push(`    Total : ${ventes.length}`)
    let totalVentes = 0
    ventes.forEach((v) => {
      totalVentes += v.montantTotal
      push(`    - [${v.id}] ${v.numero} | ${formatDate(v.date)} | Magasin ${v.magasin?.code} | Client ${v.client?.nom ?? v.clientLibre ?? '-'} | Total=${formatMontant(v.montantTotal)} | Payé=${formatMontant(v.montantPaye)} | Statut=${v.statut} | Paiement=${v.statutPaiement}`)
      v.lignes?.forEach((l) => push(`        Ligne: ${l.produit?.code} | ${l.designation} | Qté=${l.quantite} | PU=${formatMontant(l.prixUnitaire)} | Montant=${formatMontant(l.montant)}`))
    })
    push(`    Montant total des ventes : ${formatMontant(totalVentes)}`)
    push('')

    // —— ACHATS ——
    const achats = await prisma.achat.findMany({
      include: {
        magasin: { select: { code: true } },
        fournisseur: { select: { nom: true } },
        utilisateur: { select: { login: true } },
        lignes: { include: { produit: { select: { code: true } } } },
      },
      orderBy: { date: 'desc' },
    }).catch(() => [])
    push('── 10. ACHATS ──')
    push(`    Total : ${achats.length}`)
    let totalAchats = 0
    achats.forEach((a) => {
      totalAchats += a.montantTotal
      push(`    - [${a.id}] ${a.numero} | ${formatDate(a.date)} | Magasin ${a.magasin?.code} | Fournisseur ${a.fournisseur?.nom ?? a.fournisseurLibre ?? '-'} | Total=${formatMontant(a.montantTotal)} | Payé=${formatMontant(a.montantPaye)} | Paiement=${a.statutPaiement}`)
      a.lignes?.forEach((l) => push(`        Ligne: ${l.produit?.code} | ${l.designation} | Qté=${l.quantite} | PU=${formatMontant(l.prixUnitaire)} | Montant=${formatMontant(l.montant)}`))
    })
    push(`    Montant total des achats : ${formatMontant(totalAchats)}`)
    push('')

    // —— CAISSE ——
    const caisseOps = await prisma.caisse.findMany({
      include: { magasin: { select: { code: true } }, utilisateur: { select: { login: true } } },
      orderBy: { date: 'desc' },
    }).catch(() => [])
    push('── 11. OPÉRATIONS CAISSE ──')
    push(`    Total : ${caisseOps.length}`)
    caisseOps.forEach((c) => push(`    - [${c.id}] ${formatDate(c.date)} | ${c.type} | Magasin ${c.magasin?.code} | Motif: ${c.motif} | Montant=${formatMontant(c.montant)}`))
    push('')

    // —— DÉPENSES ——
    const depenses = await prisma.depense.findMany({
      include: { magasin: { select: { code: true } }, utilisateur: { select: { login: true } } },
      orderBy: { date: 'desc' },
    }).catch(() => [])
    push('── 12. DÉPENSES ──')
    push(`    Total : ${depenses.length}`)
    const depensesParCat = {}
    let totalDepenses = 0
    depenses.forEach((d) => {
      totalDepenses += d.montant
      depensesParCat[d.categorie] = (depensesParCat[d.categorie] || 0) + 1
      push(`    - [${d.id}] ${formatDate(d.date)} | ${d.categorie} | ${d.libelle} | Montant=${formatMontant(d.montant)} | Magasin ${d.magasin?.code ?? '-'}`)
    })
    push('    Répartition par catégorie : ' + JSON.stringify(depensesParCat))
    push(`    Montant total des dépenses : ${formatMontant(totalDepenses)}`)
    push('')

    // —— CHARGES ——
    const charges = await prisma.charge.findMany({
      include: { magasin: { select: { code: true } }, utilisateur: { select: { login: true } } },
      orderBy: { date: 'desc' },
    }).catch(() => [])
    push('── 13. CHARGES ──')
    push(`    Total : ${charges.length}`)
    let totalCharges = 0
    charges.forEach((c) => {
      totalCharges += c.montant
      push(`    - [${c.id}] ${formatDate(c.date)} | ${c.type} | ${c.rubrique} | Montant=${formatMontant(c.montant)} | Magasin ${c.magasin?.code ?? '-'}`)
    })
    push(`    Montant total des charges : ${formatMontant(totalCharges)}`)
    push('')

    // —— BANQUES ——
    const banques = await prisma.banque.findMany({
      include: { compte: { select: { numero: true, libelle: true } } },
      orderBy: { id: 'asc' },
    }).catch(() => [])
    push('── 14. COMPTES BANCAIRES ──')
    push(`    Total : ${banques.length}`)
    banques.forEach((b) => push(`    - [${b.id}] ${b.numero} | ${b.nomBanque} | ${b.libelle} | Solde initial=${formatMontant(b.soldeInitial)} | Compte ${b.compte?.numero ?? '-'}`))
    push('')

    // —— OPÉRATIONS BANCAIRES ——
    const opsBancaires = await prisma.operationBancaire.findMany({
      include: { banque: { select: { numero: true } }, utilisateur: { select: { login: true } } },
      orderBy: { date: 'desc' },
    }).catch(() => [])
    push('── 15. OPÉRATIONS BANCAIRES ──')
    push(`    Total : ${opsBancaires.length}`)
    opsBancaires.forEach((o) => push(`    - [${o.id}] ${formatDate(o.date)} | Banque ${o.banque?.numero} | ${o.type} | ${o.libelle} | Montant=${formatMontant(o.montant)} | Solde après=${formatMontant(o.soldeApres)}`))
    push('')

    // —— PARAMÈTRES ——
    const parametres = await prisma.parametre.findFirst().catch(() => null)
    push('── 16. PARAMÈTRES ENTREPRISE ──')
    if (parametres) {
      push(`    - Nom: ${parametres.nomEntreprise} | Contact: ${parametres.contact} | Localisation: ${parametres.localisation} | Devise: ${parametres.devise} | TVA: ${parametres.tvaParDefaut}`)
    } else {
      push('    (aucun enregistrement)')
    }
    push('')

    // —— PLAN DE COMPTES (si présent) ——
    const planComptes = await prisma.planCompte.findMany({ orderBy: { numero: 'asc' } }).catch(() => [])
    push('── 17. PLAN DE COMPTES (SYSCOHADA) ──')
    push(`    Total : ${planComptes.length}`)
    if (planComptes.length > 0 && planComptes.length <= 50) {
      planComptes.forEach((p) => push(`    - ${p.numero} | ${p.libelle} | Classe ${p.classe} | ${p.type}`))
    } else if (planComptes.length > 50) {
      push('    (liste tronquée : ' + planComptes.length + ' comptes)')
      planComptes.slice(0, 20).forEach((p) => push(`    - ${p.numero} | ${p.libelle}`))
    }
    push('')

    // —— JOURNAUX ——
    const journaux = await prisma.journal.findMany({ orderBy: { code: 'asc' } }).catch(() => [])
    push('── 18. JOURNAUX COMPTABLES ──')
    push(`    Total : ${journaux.length}`)
    journaux.forEach((j) => push(`    - ${j.code} | ${j.libelle} | ${j.type}`))
    push('')

    // —— ÉCRITURES COMPTABLES ——
    const ecritures = await prisma.ecritureComptable.findMany({
      include: { compte: { select: { numero: true } }, journal: { select: { code: true } } },
      orderBy: { date: 'desc' },
      take: 500,
    }).catch(() => [])
    const countEcritures = await prisma.ecritureComptable.count().catch(() => 0)
    push('── 19. ÉCRITURES COMPTABLES ──')
    push(`    Total : ${countEcritures} (affichage des ${Math.min(500, countEcritures)} dernières)`)
    ecritures.forEach((e) => push(`    - ${e.numero} | ${formatDate(e.date)} | Journal ${e.journal?.code} | Compte ${e.compte?.numero} | Débit=${formatMontant(e.debit)} | Crédit=${formatMontant(e.credit)} | ${e.libelle}`))
    push('')

    // —— AUDIT LOGS ——
    const auditLogs = await prisma.auditLog.findMany({
      include: { utilisateur: { select: { login: true } } },
      orderBy: { date: 'desc' },
      take: 200,
    }).catch(() => [])
    const countAudit = await prisma.auditLog.count().catch(() => 0)
    push('── 20. JOURNAL D\'AUDIT (traçabilité) ──')
    push(`    Total : ${countAudit} (affichage des ${Math.min(200, countAudit)} derniers)`)
    auditLogs.forEach((a) => push(`    - ${formatDate(a.date)} | ${a.action} | ${a.type} | ${a.utilisateur?.login} | ${a.description || ''}`))
    push('')

    // —— TEMPLATES IMPRESSION ——
    const templates = await prisma.printTemplate.findMany().catch(() => [])
    push('── 21. MODÈLES D\'IMPRESSION ──')
    push(`    Total : ${templates.length}`)
    templates.forEach((t) => push(`    - [${t.id}] ${t.type} | ${t.nom} | actif=${t.actif}`))
    push('')

    // —— RÉSUMÉ GLOBAL ——
    push('═══════════════════════════════════════════════════════════════════')
    push('  RÉSUMÉ GLOBAL (à reprendre pour fusion)')
    push('═══════════════════════════════════════════════════════════════════')
    push(`  - Entités : ${entites.length}`)
    push(`  - Magasins : ${magasins.length}`)
    push(`  - Utilisateurs : ${utilisateurs.length}`)
    push(`  - Produits : ${produits.length}`)
    push(`  - Lignes de stock : ${stocks.length}`)
    push(`  - Mouvements de stock : ${mouvements.length} (Entrées: ${entrées.length}, Sorties: ${sorties.length})`)
    push(`  - Clients : ${clients.length}`)
    push(`  - Fournisseurs : ${fournisseurs.length}`)
    push(`  - Ventes : ${ventes.length} (Montant total: ${formatMontant(totalVentes)})`)
    push(`  - Achats : ${achats.length} (Montant total: ${formatMontant(totalAchats)})`)
    push(`  - Opérations caisse : ${caisseOps.length}`)
    push(`  - Dépenses : ${depenses.length} (Montant total: ${formatMontant(totalDepenses)})`)
    push(`  - Charges : ${charges.length} (Montant total: ${formatMontant(totalCharges)})`)
    push(`  - Comptes bancaires : ${banques.length}`)
    push(`  - Opérations bancaires : ${opsBancaires.length}`)
    push(`  - Écritures comptables : ${countEcritures}`)
    push(`  - Entrées journal d'audit : ${countAudit}`)
    push('')

    // Écrire le rapport dans docs/
    const reportPath = path.join(projectRoot, 'docs', 'RECAP_ANCIENNE_BASE_gesticomold.txt')
    fs.writeFileSync(reportPath, lignes.join('\n'), 'utf8')
    push('Rapport enregistré dans : ' + reportPath)
  } catch (e) {
    console.error('Erreur analyse:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

run()
