import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getEntiteId } from '@/lib/get-entite-id'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Id invalide.' }, { status: 400 })
  }

  const achat = await prisma.achat.findUnique({
    where: { id },
    include: {
      magasin: { select: { code: true, nom: true } },
      fournisseur: { select: { nom: true } },
      lignes: true,
    },
  })

  if (!achat) {
    return NextResponse.json({ error: 'Achat introuvable.' }, { status: 404 })
  }

  if (session.role !== 'SUPER_ADMIN') {
    const entiteId = await getEntiteId(session)
    if (achat.entiteId !== entiteId) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }
  }

  return NextResponse.json(achat)
}
