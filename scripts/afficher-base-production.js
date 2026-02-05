/**
 * Affiche le contenu de la base de production sous forme de tableaux
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, '..', 'docs', 'gesticom_production.db')

if (!fs.existsSync(dbPath)) {
  console.error(`❌ Base de production non trouvée : ${dbPath}`)
  process.exit(1)
}

process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`

const prisma = new PrismaClient()

function formatTableau(titre, enTetes, lignes, maxLignes = 20) {
  console.log('')
  console.log('='.repeat(100))
  console.log(`📋 ${titre}`)
  console.log('='.repeat(100))
  
  if (lignes.length === 0) {
    console.log('   (Aucun enregistrement)')
    return
  }
  
  // Afficher les en-têtes
  console.log('')
  const header = enTetes.map(h => h.padEnd(h.length < 20 ? 20 : h.length)).join(' | ')
  console.log(header)
  console.log('-'.repeat(header.length))
  
  // Afficher les lignes
  const lignesAAfficher = lignes.slice(0, maxLignes)
  lignesAAfficher.forEach((ligne, i) => {
    const row = ligne.map((cell, j) => {
      const val = String(cell || '').substring(0, enTetes[j].length < 20 ? 20 : enTetes[j].length)
      return val.padEnd(enTetes[j].length < 20 ? 20 : enTetes[j].length)
    }).join(' | ')
    console.log(row)
  })
  
  if (lignes.length > maxLignes) {
    console.log(`   ... et ${lignes.length - maxLignes} autres enregistrements`)
  }
  
  console.log('')
  console.log(`   Total : ${lignes.length} enregistrement(s)`)
}

async function main() {
  try {
    console.log('')
    console.log('='.repeat(100))
    console.log('📊 CONTENU DE LA BASE DE PRODUCTION')
    console.log('='.repeat(100))
    console.log(`📁 Chemin: ${dbPath}`)
    console.log('')
    
    // ===== ENTITÉS =====
    const entites = await prisma.entite.findMany()
    formatTableau('ENTITÉS', ['ID', 'Code', 'Nom', 'Type', 'Localisation', 'Active'], 
      entites.map(e => [
        e.id,
        e.code,
        e.nom,
        e.type,
        e.localisation,
        e.active ? 'Oui' : 'Non'
      ])
    )
    
    // ===== MAGASINS =====
    const magasins = await prisma.magasin.findMany({
      include: { entite: true }
    })
    formatTableau('MAGASINS', ['ID', 'Code', 'Nom', 'Localisation', 'Entité', 'Actif'],
      magasins.map(m => [
        m.id,
        m.code,
        m.nom,
        m.localisation,
        m.entite.nom,
        m.actif ? 'Oui' : 'Non'
      ])
    )
    
    // ===== UTILISATEURS =====
    const utilisateurs = await prisma.utilisateur.findMany({
      select: {
        id: true,
        login: true,
        nom: true,
        email: true,
        role: true,
        actif: true,
        entite: { select: { nom: true } }
      }
    })
    formatTableau('UTILISATEURS', ['ID', 'Login', 'Nom', 'Email', 'Rôle', 'Entité', 'Actif'],
      utilisateurs.map(u => [
        u.id,
        u.login,
        u.nom,
        u.email || '',
        u.role,
        u.entite.nom,
        u.actif ? 'Oui' : 'Non'
      ])
    )
    
    // ===== PRODUITS =====
    const produits = await prisma.produit.findMany({
      orderBy: { id: 'asc' }
    })
    formatTableau('PRODUITS', ['ID', 'Code', 'Désignation', 'Catégorie', 'Prix Achat', 'Prix Vente', 'Seuil', 'Actif'],
      produits.map(p => [
        p.id,
        p.code,
        p.designation.substring(0, 30),
        p.categorie,
        p.prixAchat ? `${p.prixAchat.toLocaleString('fr-FR')} FCFA` : '0 FCFA',
        p.prixVente ? `${p.prixVente.toLocaleString('fr-FR')} FCFA` : '0 FCFA',
        p.seuilMin,
        p.actif ? 'Oui' : 'Non'
      ]),
      50
    )
    
    // ===== STOCKS =====
    const stocks = await prisma.stock.findMany({
      select: {
        id: true,
        produitId: true,
        magasinId: true,
        quantite: true,
        quantiteInitiale: true,
        produit: { select: { code: true, designation: true } },
        magasin: { select: { code: true, nom: true } }
      },
      orderBy: [{ magasinId: 'asc' }, { produitId: 'asc' }]
    }).catch(() => [])
    formatTableau('STOCKS', ['ID', 'Produit Code', 'Produit', 'Magasin', 'Qté Courante', 'Qté Initiale'],
      stocks.map(s => [
        s.id,
        s.produit.code,
        s.produit.designation.substring(0, 25),
        s.magasin.code,
        s.quantite,
        s.quantiteInitiale
      ]),
      50
    )
    
    // ===== CLIENTS =====
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        nom: true,
        telephone: true,
        type: true,
        plafondCredit: true,
        actif: true
      }
    }).catch(() => [])
    formatTableau('CLIENTS', ['ID', 'Nom', 'Téléphone', 'Type', 'Plafond Crédit', 'Actif'],
      clients.map(c => [
        c.id,
        c.nom,
        c.telephone || '',
        c.type,
        c.plafondCredit ? `${c.plafondCredit.toLocaleString('fr-FR')} FCFA` : '0 FCFA',
        'N/A', // NCC n'existe pas dans cette base
        c.actif ? 'Oui' : 'Non'
      ])
    )
    
    // ===== FOURNISSEURS =====
    const fournisseurs = await prisma.fournisseur.findMany()
    formatTableau('FOURNISSEURS', ['ID', 'Nom', 'Téléphone', 'Email', 'NCC', 'Actif'],
      fournisseurs.map(f => [
        f.id,
        f.nom,
        f.telephone || '',
        f.email || '',
        f.ncc || '',
        f.actif ? 'Oui' : 'Non'
      ])
    )
    
    // ===== VENTES =====
    const ventes = await prisma.vente.findMany({
      select: {
        id: true,
        numero: true,
        date: true,
        montantTotal: true,
        montantPaye: true,
        statutPaiement: true,
        statut: true,
        clientLibre: true,
        magasin: { select: { code: true } },
        client: { select: { nom: true } },
        utilisateur: { select: { nom: true } }
      },
      orderBy: { date: 'desc' }
    }).catch(() => [])
    formatTableau('VENTES', ['ID', 'Numéro', 'Date', 'Magasin', 'Client', 'Montant Total', 'Montant Payé', 'Statut Paiement', 'Statut'],
      ventes.map(v => [
        v.id,
        v.numero,
        new Date(v.date).toLocaleDateString('fr-FR'),
        v.magasin.code,
        v.client?.nom || v.clientLibre || 'N/A',
        `${v.montantTotal.toLocaleString('fr-FR')} FCFA`,
        `${v.montantPaye.toLocaleString('fr-FR')} FCFA`,
        v.statutPaiement,
        v.statut
      ])
    )
    
    // ===== ACHATS =====
    const achats = await prisma.achat.findMany({
      select: {
        id: true,
        numero: true,
        date: true,
        montantTotal: true,
        montantPaye: true,
        statutPaiement: true,
        fournisseurLibre: true,
        magasin: { select: { code: true } },
        fournisseur: { select: { nom: true } },
        utilisateur: { select: { nom: true } }
      },
      orderBy: { date: 'desc' }
    }).catch(() => [])
    formatTableau('ACHATS', ['ID', 'Numéro', 'Date', 'Magasin', 'Fournisseur', 'Montant Total', 'Montant Payé', 'Statut Paiement'],
      achats.map(a => [
        a.id,
        a.numero,
        new Date(a.date).toLocaleDateString('fr-FR'),
        a.magasin.code,
        a.fournisseur?.nom || a.fournisseurLibre || 'N/A',
        `${a.montantTotal.toLocaleString('fr-FR')} FCFA`,
        `${a.montantPaye.toLocaleString('fr-FR')} FCFA`,
        a.statutPaiement
      ])
    )
    
    // ===== MOUVEMENTS =====
    const mouvements = await prisma.mouvement.findMany({
      select: {
        id: true,
        date: true,
        type: true,
        quantite: true,
        produit: { select: { code: true, designation: true } },
        magasin: { select: { code: true } },
        utilisateur: { select: { nom: true } }
      },
      orderBy: { date: 'desc' }
    }).catch(() => [])
    formatTableau('MOUVEMENTS DE STOCK', ['ID', 'Date', 'Type', 'Produit', 'Magasin', 'Quantité', 'Utilisateur'],
      mouvements.map(m => [
        m.id,
        new Date(m.date).toLocaleDateString('fr-FR'),
        m.type,
        m.produit.code,
        m.magasin.code,
        m.quantite,
        m.utilisateur.nom
      ])
    )
    
    // ===== CAISSE =====
    const caisse = await prisma.caisse.findMany({
      select: {
        id: true,
        date: true,
        type: true,
        motif: true,
        montant: true,
        magasin: { select: { code: true } },
        utilisateur: { select: { nom: true } }
      },
      orderBy: { date: 'desc' }
    }).catch(() => [])
    formatTableau('OPÉRATIONS CAISSE', ['ID', 'Date', 'Type', 'Magasin', 'Motif', 'Montant', 'Utilisateur'],
      caisse.map(c => [
        c.id,
        new Date(c.date).toLocaleDateString('fr-FR'),
        c.type,
        c.magasin.code,
        c.motif.substring(0, 30),
        `${c.montant.toLocaleString('fr-FR')} FCFA`,
        c.utilisateur.nom
      ])
    )
    
    // ===== DÉPENSES =====
    const depenses = await prisma.depense.findMany({
      select: {
        id: true,
        date: true,
        categorie: true,
        libelle: true,
        montant: true,
        montantPaye: true,
        statutPaiement: true,
        modePaiement: true,
        magasin: { select: { code: true } },
        utilisateur: { select: { nom: true } }
      },
      orderBy: { date: 'desc' }
    }).catch(() => [])
    formatTableau('DÉPENSES', ['ID', 'Date', 'Catégorie', 'Libellé', 'Magasin', 'Montant', 'Montant Payé', 'Statut', 'Mode Paiement'],
      depenses.map(d => [
        d.id,
        new Date(d.date).toLocaleDateString('fr-FR'),
        d.categorie,
        d.libelle.substring(0, 25),
        d.magasin?.code || 'N/A',
        `${d.montant.toLocaleString('fr-FR')} FCFA`,
        `${d.montantPaye.toLocaleString('fr-FR')} FCFA`,
        d.statutPaiement,
        d.modePaiement
      ])
    )
    
    // ===== CHARGES =====
    const charges = await prisma.charge.findMany({
      select: {
        id: true,
        date: true,
        type: true,
        rubrique: true,
        montant: true,
        magasin: { select: { code: true } },
        utilisateur: { select: { nom: true } }
      },
      orderBy: { date: 'desc' }
    }).catch(() => [])
    formatTableau('CHARGES', ['ID', 'Date', 'Type', 'Rubrique', 'Magasin', 'Montant', 'Utilisateur'],
      charges.map(c => [
        c.id,
        new Date(c.date).toLocaleDateString('fr-FR'),
        c.type,
        c.rubrique,
        c.magasin?.code || 'N/A',
        `${c.montant.toLocaleString('fr-FR')} FCFA`,
        c.utilisateur.nom
      ])
    )
    
    console.log('')
    console.log('='.repeat(100))
    console.log('✨ Affichage terminé')
    console.log('='.repeat(100))
    console.log('')
    
  } catch (e) {
    console.error('❌ Erreur:', e.message)
    console.error(e.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
