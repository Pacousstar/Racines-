import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logModification, getIpAddress } from '@/lib/audit'
import { comptabiliserTransfert } from '@/lib/comptabilisation'
import { getEntiteId } from '@/lib/get-entite-id'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 20))
  const skip = (page - 1) * limit
  const dateDebut = request.nextUrl.searchParams.get('dateDebut')?.trim()
  const dateFin = request.nextUrl.searchParams.get('dateFin')?.trim()
  const magasinIdParam = request.nextUrl.searchParams.get('magasinId')
  const where: { date?: { gte: Date; lte: Date }; entiteId?: number; OR?: Array<{ magasinOrigineId: number } | { magasinDestId: number }> } = {}
  if (dateDebut && dateFin) {
    where.date = { gte: new Date(dateDebut + 'T00:00:00'), lte: new Date(dateFin + 'T23:59:59') }
  }
  const magasinIdNum = magasinIdParam ? Number(magasinIdParam) : NaN
  if (Number.isInteger(magasinIdNum) && magasinIdNum > 0) {
    where.OR = [{ magasinOrigineId: magasinIdNum }, { magasinDestId: magasinIdNum }]
  }
  if (session.role !== 'SUPER_ADMIN' && session.entiteId) where.entiteId = session.entiteId

  const [data, total] = await Promise.all([
    prisma.transfert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        magasinOrigine: { select: { id: true, code: true, nom: true } },
        magasinDest: { select: { id: true, code: true, nom: true } },
        utilisateur: { select: { nom: true } },
        lignes: { include: { produit: { select: { code: true, designation: true } } } },
      },
    }),
    prisma.transfert.count({ where }),
  ])
  return NextResponse.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  try {
    const body = await request.json()
    console.log('🔍 API /api/transferts POST - Body reçu:', JSON.stringify(body, null, 2))
    const magasinOrigineId = Number(body?.magasinOrigineId)
    const magasinDestId = Number(body?.magasinDestId)
    const observation = body?.observation != null ? String(body.observation).trim() || null : null
    const dateStr = body?.date != null ? String(body.date).trim() : null
    const dateTransfert = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
    if (isNaN(dateTransfert.getTime())) return NextResponse.json({ error: 'Date invalide.' }, { status: 400 })
    const lignes = Array.isArray(body?.lignes) ? body.lignes : []

    if (!Number.isInteger(magasinOrigineId) || magasinOrigineId < 1 || !Number.isInteger(magasinDestId) || magasinDestId < 1) {
      return NextResponse.json({ error: 'Magasin origine et destination requis.' }, { status: 400 })
    }
    if (magasinOrigineId === magasinDestId) {
      return NextResponse.json({ error: 'Origine et destination doivent etre differents.' }, { status: 400 })
    }
    if (!lignes.length) return NextResponse.json({ error: 'Au moins une ligne requise.' }, { status: 400 })

    const entiteId = await getEntiteId(session)
    const [magasinOrigine, magasinDest] = await Promise.all([
      prisma.magasin.findUnique({ where: { id: magasinOrigineId }, include: { entite: { select: { id: true } } } }),
      prisma.magasin.findUnique({ where: { id: magasinDestId }, include: { entite: { select: { id: true } } } }),
    ])
    if (!magasinOrigine || !magasinDest) {
      return NextResponse.json({ error: 'Magasin origine ou destination introuvable.' }, { status: 400 })
    }
    if (session.role !== 'SUPER_ADMIN' && (magasinOrigine.entiteId !== entiteId || magasinDest.entiteId !== entiteId)) {
      return NextResponse.json({ error: 'Les deux magasins doivent appartenir a votre entite.' }, { status: 403 })
    }

    const lignesValides: Array<{ produitId: number; designation: string; quantite: number; prixAchat: number | null }> = []
    for (const l of lignes) {
      const produitId = Number(l?.produitId)
      const quantite = Math.max(1, Math.floor(Number(l?.quantite) || 0))
      if (!produitId || !quantite) continue
      const produit = await prisma.produit.findUnique({ where: { id: produitId } })
      if (!produit) continue
      lignesValides.push({ produitId, designation: produit.designation, quantite, prixAchat: produit.prixAchat })
    }
    if (!lignesValides.length) return NextResponse.json({ error: 'Lignes invalides.' }, { status: 400 })

    console.log('🔍 Lignes valides:', lignesValides.length)

    for (const l of lignesValides) {
      console.log(`🔍 Vérification stock pour ${l.designation} (ID: ${l.produitId})`)
      const st = await prisma.stock.findUnique({
        where: { produitId_magasinId: { produitId: l.produitId, magasinId: magasinOrigineId } },
      })
      const qte = st?.quantite ?? 0
      console.log(`📦 Stock disponible: ${qte}, demandé: ${l.quantite}`)
      if (qte < l.quantite) {
        console.log(`⚠️ Stock insuffisant : ${l.designation} - dispo: ${qte}, demandé: ${l.quantite}`)
        return NextResponse.json(
          { error: `Stock insuffisant pour ${l.designation} (dispo: ${qte})` },
          { status: 400 }
        )
      }
    }

    console.log('✅ Toutes les vérifications passées, création du transfert...')
    const num = `TRF-${Date.now()}`
    console.log(`🔍 Numéro de transfert: ${num}`)
    console.log('🔍 Début de la transaction...')
    const transfert = await prisma.$transaction(async (tx) => {
      console.log('🔍 Création du transfert dans la BD...')
      const t = await tx.transfert.create({
        data: {
          numero: num,
          date: dateTransfert,
          magasinOrigineId,
          magasinDestId,
          entiteId: magasinOrigine.entiteId,
          utilisateurId: session.userId,
          observation,
          lignes: {
            create: lignesValides.map((l) => ({ produitId: l.produitId, designation: l.designation, quantite: l.quantite })),
          },
        },
        include: {
          lignes: { include: { produit: true } },
          magasinOrigine: { select: { code: true, nom: true } },
          magasinDest: { select: { code: true, nom: true } },
        },
      })
      console.log(`✅ Transfert créé: ID ${t.id}`)
      console.log('🔍 Création des mouvements et mise à jour des stocks...')
      for (const l of lignesValides) {
        console.log(`  - Traitement produit ${l.designation}...`)
        await tx.mouvement.create({
          data: {
            date: dateTransfert,
            type: 'SORTIE',
            produitId: l.produitId,
            magasinId: magasinOrigineId,
            entiteId: magasinOrigine.entiteId,
            utilisateurId: session.userId,
            quantite: l.quantite,
            observation: `Transfert ${num} -> ${magasinDest.nom}`,
            referenceTransfertId: t.id,
          },
        })
        await tx.mouvement.create({
          data: {
            date: dateTransfert,
            type: 'ENTREE',
            produitId: l.produitId,
            magasinId: magasinDestId,
            entiteId: magasinDest.entiteId,
            utilisateurId: session.userId,
            quantite: l.quantite,
            observation: `Transfert ${num} depuis ${magasinOrigine.nom}`,
            referenceTransfertId: t.id,
          },
        })
        await tx.stock.updateMany({
          where: { produitId: l.produitId, magasinId: magasinOrigineId },
          data: { quantite: { decrement: l.quantite } },
        })
        let stDest = await tx.stock.findUnique({
          where: { produitId_magasinId: { produitId: l.produitId, magasinId: magasinDestId } },
        })
        if (!stDest) {
          stDest = await tx.stock.create({
            data: { produitId: l.produitId, magasinId: magasinDestId, quantite: 0, quantiteInitiale: 0 },
          })
        }
        await tx.stock.update({ where: { id: stDest.id }, data: { quantite: { increment: l.quantite } } })
        console.log(`  ✅ ${l.designation} traité`)
      }
      console.log('✅ Transaction terminée avec succès')
      return t
    })
    console.log('🔍 Sortie de la transaction')

    const montantTotal = lignesValides.reduce((s, l) => s + l.quantite * (l.prixAchat ?? 0), 0)
    try {
      await comptabiliserTransfert({
        transfertId: transfert.id,
        numero: num,
        date: dateTransfert,
        magasinOrigineNom: transfert.magasinOrigine.nom,
        magasinDestNom: transfert.magasinDest.nom,
        montantTotal,
        utilisateurId: session.userId,
      })
    } catch (e) {
      console.error('Compta transfert:', e)
    }

    const ipAddress = getIpAddress(request)
    await logModification(session, 'TRANSFERT', transfert.id, `Transfert ${num} ${magasinOrigine.nom} -> ${magasinDest.nom}`, {}, { lignes: lignesValides.length }, ipAddress)
    
    console.log('✅ Transfert créé avec succès:', transfert.id, transfert.numero)
    
    // Invalider le cache pour affichage immédiat
    revalidatePath('/dashboard/transferts')
    revalidatePath('/dashboard/stock')
    revalidatePath('/api/transferts')
    
    return NextResponse.json(transfert)
  } catch (e) {
    console.error('❌ POST /api/transferts - Erreur:', e)
    const errorMessage = e instanceof Error ? e.message : 'Erreur serveur.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
